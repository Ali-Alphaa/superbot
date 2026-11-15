//! botd: the server. Owns Bots, chats, memory files, and routines; runs each Bot
//! on its harness (Claude Code, Codex, or Pi); serves the web app and its API.

mod adapters;
mod cron;
mod db;
mod runner;

use axum::extract::{Path, Request, State};
use axum::http::{header, StatusCode};
use axum::middleware::{self, Next};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use db::{BotPatch, Db};
use runner::{App, Config};
use serde_json::{json, Value};
use std::convert::Infallible;
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;

type AppState = Arc<App>;

static PASSWORD: OnceLock<String> = OnceLock::new();
static WEB_DIR: OnceLock<Option<PathBuf>> = OnceLock::new();

const COLORS: [&str; 8] = ["#4cc06a", "#3b7ff0", "#f0a243", "#ef4b4b", "#8b5cf6", "#f2f2f2", "#22b8cf", "#e64980"];
const SHAPES: [&str; 4] = ["round", "wide", "star", "cloud"];

fn env(key: &str, default: &str) -> String {
    std::env::var(key).ok().filter(|v| !v.is_empty()).unwrap_or_else(|| default.into())
}

pub fn random_bytes(n: usize) -> Vec<u8> {
    use std::io::Read;
    let mut b = vec![0u8; n];
    std::fs::File::open("/dev/urandom").and_then(|mut f| f.read_exact(&mut b)).expect("read /dev/urandom");
    b
}

pub fn short_id() -> String {
    random_bytes(4).iter().map(|x| format!("{x:02x}")).collect()
}

fn pick<'a>(a: &[&'a str]) -> &'a str {
    a[random_bytes(1)[0] as usize % a.len()]
}

#[tokio::main]
async fn main() {
    let port: u16 = env("PORT", "3000").parse().expect("PORT must be a number");
    let host = env("HOST", "127.0.0.1");
    let password = env("AUTH_PASSWORD", "");
    let default_harness = env("DEFAULT_HARNESS", "claude");
    if password.is_empty() && !["127.0.0.1", "localhost", "::1"].contains(&host.as_str()) {
        eprintln!("Refusing to listen on a public address without AUTH_PASSWORD.");
        std::process::exit(1);
    }
    if adapters::get(&default_harness).is_none() {
        eprintln!("DEFAULT_HARNESS must be one of: {}", adapters::NAMES.join(", "));
        std::process::exit(1);
    }
    PASSWORD.set(password).unwrap();
    WEB_DIR.set(std::env::var("WEB_DIR").ok().map(PathBuf::from)).unwrap();

    let abs = |p: String| std::path::absolute(p).expect("bad path");
    let data_dir = abs(env("DATA_DIR", "data"));
    let workspace = abs(env("WORKSPACE_DIR", "workspace"));
    std::fs::create_dir_all(&data_dir).expect("create DATA_DIR");
    std::fs::create_dir_all(&workspace).expect("create WORKSPACE_DIR");
    let db = Db::open(&data_dir.join("app.sqlite")).expect("open database");

    let app = App::new(db, Config {
        data_dir,
        workspace,
        user_name: env("USER_NAME", "the user"),
        // `botctl` ships next to `botd`.
        bin_dir: std::env::current_exe().unwrap().parent().unwrap().to_path_buf(),
        api_url: format!("http://127.0.0.1:{port}"),
        bot_token: random_bytes(24).iter().map(|x| format!("{x:02x}")).collect(),
        run_timeout: Duration::from_secs(60 * env("RUN_TIMEOUT_MINUTES", "60").parse::<u64>().unwrap_or(60)),
        default_harness,
    });

    // First start: create the primary Bot.
    if app.db.bots().is_empty() {
        let name = env("PRIMARY_BOT_NAME", "Assistant");
        let bot = app.db.create_bot(&name, "#f5f5f5", "round", &app.cfg.default_harness, None, true);
        app.init_bot_files(&bot);
    }

    let api = Router::new()
        .route("/state", get(state))
        .route("/events", get(events))
        .route("/bots", get(list_bots).post(create_bot))
        .route("/bots/{id}", patch(update_bot).delete(delete_bot))
        .route("/bots/{id}/messages", get(list_messages).post(send_message))
        .route("/bots/{id}/read", post(mark_read))
        .route("/bots/{id}/stop", post(stop_bot))
        .route("/bots/{id}/routines", get(list_routines).post(create_routine))
        .route("/routines/{id}", patch(update_routine).delete(delete_routine));
    let router = Router::new()
        .nest("/api", api)
        .fallback(get(web))
        .layer(middleware::from_fn_with_state(app.clone(), auth))
        .route("/healthz", get(|| async { Json(json!({ "ok": true })) }))
        .with_state(app.clone());

    app.recover();
    cron::start(app.clone());

    let listener = tokio::net::TcpListener::bind((host.as_str(), port)).await.expect("bind");
    println!("Listening on http://{host}:{port}");
    println!("Harnesses on PATH: {}. Default: {}.", adapters::installed().join(", "), app.cfg.default_harness);

    // On SIGTERM/SIGINT: stop agents (queued work runs after restart), then exit.
    let shutdown_app = app.clone();
    tokio::spawn(async move {
        use tokio::signal::unix::{signal, SignalKind};
        let (mut term, mut int) = (signal(SignalKind::terminate()).unwrap(), signal(SignalKind::interrupt()).unwrap());
        tokio::select! { _ = term.recv() => {}, _ = int.recv() => {} }
        shutdown_app.shutdown();
        for _ in 0..60 {
            if shutdown_app.is_idle() {
                break;
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
        std::process::exit(0);
    });

    axum::serve(listener, router).await.unwrap();
}

// Errors

struct ApiError(StatusCode, String);

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({ "error": self.1 }))).into_response()
    }
}

fn bad(msg: impl Into<String>) -> ApiError {
    ApiError(StatusCode::BAD_REQUEST, msg.into())
}

fn not_found(what: &str) -> ApiError {
    ApiError(StatusCode::NOT_FOUND, format!("{what} not found"))
}

type Res<T = Json<Value>> = Result<T, ApiError>;

// Auth: browser login with AUTH_PASSWORD (any username), or the Bots' token for `botctl`.

async fn auth(State(app): State<AppState>, req: Request, next: Next) -> Response {
    let h = req.headers().get(header::AUTHORIZATION).and_then(|v| v.to_str().ok()).unwrap_or("");
    let password = PASSWORD.get().unwrap();
    let ok = password.is_empty()
        || h.strip_prefix("Bearer ").is_some_and(|t| same(t.as_bytes(), app.cfg.bot_token.as_bytes()))
        || h.strip_prefix("Basic ").and_then(base64_decode).is_some_and(|creds| {
            let pass = creds.splitn(2, |b| *b == b':').nth(1).unwrap_or_default();
            same(pass, password.as_bytes())
        });
    if ok {
        next.run(req).await
    } else {
        (StatusCode::UNAUTHORIZED, [(header::WWW_AUTHENTICATE, "Basic realm=\"Bots\"")], "Login required").into_response()
    }
}

/// Constant-time comparison.
fn same(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).fold(0, |acc, (x, y)| acc | (x ^ y)) == 0
}

fn base64_decode(s: &str) -> Option<Vec<u8>> {
    const T: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let (mut out, mut buf, mut bits) = (Vec::new(), 0u32, 0);
    for c in s.trim().bytes().filter(|c| *c != b'=') {
        buf = (buf << 6) | T.iter().position(|x| *x == c)? as u32;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buf >> bits) as u8);
        }
    }
    Some(out)
}

// Web app: embedded in the binary. Set WEB_DIR to serve from disk while editing it.

async fn web(uri: axum::http::Uri) -> Response {
    let path = uri.path();
    let file = match path {
        "/" | "/index.html" => "index.html",
        "/app.js" => "app.js",
        "/styles.css" => "styles.css",
        _ => return (StatusCode::NOT_FOUND, "Not found").into_response(),
    };
    let kind = match file.rsplit('.').next() {
        Some("html") => "text/html; charset=utf-8",
        Some("js") => "text/javascript; charset=utf-8",
        _ => "text/css; charset=utf-8",
    };
    let body = match WEB_DIR.get().unwrap() {
        Some(dir) => std::fs::read_to_string(dir.join(file)).unwrap_or_default(),
        None => match file {
            "index.html" => include_str!("../../web/index.html"),
            "app.js" => include_str!("../../web/app.js"),
            _ => include_str!("../../web/styles.css"),
        }
        .to_string(),
    };
    ([(header::CONTENT_TYPE, kind), (header::CACHE_CONTROL, "no-cache")], body).into_response()
}

// Live updates: one Server-Sent Events stream with everything.

async fn events(State(app): State<AppState>) -> impl IntoResponse {
    let stream = BroadcastStream::new(app.tx.subscribe()).map(|r| {
        // A slow client that missed events is told to reload its state.
        Ok::<_, Infallible>(Event::default().data(r.unwrap_or_else(|_| r#"{"type":"resync"}"#.into())))
    });
    ([("x-accel-buffering", "no")], Sse::new(stream).keep_alive(KeepAlive::default()))
}

// Bots

async fn state(State(app): State<AppState>) -> Json<Value> {
    let bots: Vec<Value> = app.db.bots().iter().map(|b| app.bot_view(b)).collect();
    Json(json!({
        "me": { "name": env("USER_NAME", "You") },
        "harnesses": adapters::installed(),
        "defaultHarness": app.cfg.default_harness,
        "bots": bots,
    }))
}

async fn list_bots(State(app): State<AppState>) -> Json<Value> {
    Json(app.db.bots().iter().map(|b| app.bot_view(b)).collect())
}

fn need_bot(app: &App, id: &str) -> Res<db::Bot> {
    app.db.bot(id).ok_or_else(|| not_found("Bot"))
}

fn bot_patch(v: &Value) -> Res<BotPatch> {
    let mut p = BotPatch::default();
    if let Some(n) = v["name"].as_str().map(str::trim).filter(|n| !n.is_empty()) {
        p.name = Some(n.chars().take(60).collect());
    }
    if let Some(c) = v["color"].as_str().filter(|c| c.len() == 7 && c.starts_with('#') && c[1..].chars().all(|x| x.is_ascii_hexdigit())) {
        p.color = Some(c.into());
    }
    if let Some(s) = v["shape"].as_str().filter(|s| SHAPES.contains(s)) {
        p.shape = Some(s.into());
    }
    if let Some(h) = v["hidden"].as_bool() {
        p.hidden = Some(h);
    }
    match &v["model"] {
        Value::Null if v.get("model").is_some() => p.model = Some(None),
        Value::String(m) => p.model = Some(Some(m.trim().to_string()).filter(|m| !m.is_empty())),
        _ => {}
    }
    if let Some(h) = v.get("harness") {
        let h = h.as_str().filter(|h| adapters::get(h).is_some());
        let h = h.ok_or_else(|| bad(format!("Harness must be one of: {}", adapters::NAMES.join(", "))))?;
        p.harness = Some(h.into());
    }
    Ok(p)
}

async fn create_bot(State(app): State<AppState>, Json(v): Json<Value>) -> Res<(StatusCode, Json<Value>)> {
    let p = bot_patch(&v)?;
    let name = p.name.ok_or_else(|| bad("Name is required"))?;
    let harness = p.harness.unwrap_or_else(|| app.cfg.default_harness.clone());
    let bot = app.db.create_bot(
        &name,
        p.color.as_deref().unwrap_or(pick(&COLORS)),
        p.shape.as_deref().unwrap_or(pick(&SHAPES)),
        &harness,
        p.model.flatten().as_deref(),
        false,
    );
    app.init_bot_files(&bot);
    app.push_bot(&bot.id);
    Ok((StatusCode::CREATED, Json(app.bot_view(&bot))))
}

async fn update_bot(State(app): State<AppState>, Path(id): Path<String>, Json(v): Json<Value>) -> Res {
    let bot = need_bot(&app, &id)?;
    let mut p = bot_patch(&v)?;
    if p.harness.as_ref().is_some_and(|h| *h != bot.harness) {
        p.session_id = Some(None); // sessions don't carry across harnesses
    }
    app.db.update_bot(&id, p);
    app.push_bot(&id);
    Ok(Json(app.bot_view(&need_bot(&app, &id)?)))
}

async fn delete_bot(State(app): State<AppState>, Path(id): Path<String>) -> Res {
    if need_bot(&app, &id)?.primary {
        return Err(bad("The primary Bot can't be deleted"));
    }
    app.stop(&id);
    app.db.delete_bot(&id);
    app.send(json!({ "type": "botDeleted", "botId": id }));
    Ok(Json(json!({ "ok": true })))
}

async fn mark_read(State(app): State<AppState>, Path(id): Path<String>) -> Res {
    need_bot(&app, &id)?;
    app.db.update_bot(&id, BotPatch { unread: Some(false), ..Default::default() });
    app.push_bot(&id);
    Ok(Json(json!({ "ok": true })))
}

async fn stop_bot(State(app): State<AppState>, Path(id): Path<String>) -> Res {
    need_bot(&app, &id)?;
    app.stop(&id);
    Ok(Json(json!({ "ok": true })))
}

// Messages

async fn list_messages(State(app): State<AppState>, Path(id): Path<String>) -> Res {
    need_bot(&app, &id)?;
    Ok(Json(json!(app.db.messages(&id, 200))))
}

async fn send_message(State(app): State<AppState>, Path(id): Path<String>, Json(v): Json<Value>) -> Res<(StatusCode, Json<Value>)> {
    need_bot(&app, &id)?;
    let text = v["text"].as_str().map(str::trim).filter(|t| !t.is_empty()).ok_or_else(|| bad("Text is required"))?;
    let text: String = text.chars().take(100_000).collect();
    // Answering a choice card: remember which option was picked.
    if let (Some(mid), Some(opt)) = (v["answer"]["messageId"].as_i64(), v["answer"]["option"].as_u64()) {
        if let Some(mut q) = app.db.message(mid).filter(|m| m.bot_id == id).and_then(|m| m.question) {
            q["picked"] = json!(opt);
            app.db.set_question(mid, &q);
        }
    }
    let msg = app.db.add_message(&id, "user", &text, None, false, Some("queued"));
    app.push_message(&msg);
    app.enqueue(msg.clone());
    Ok((StatusCode::ACCEPTED, Json(json!(msg))))
}

// Routines

async fn list_routines(State(app): State<AppState>, Path(id): Path<String>) -> Res {
    need_bot(&app, &id)?;
    Ok(Json(json!(app.db.routines(Some(&id)))))
}

async fn create_routine(State(app): State<AppState>, Path(id): Path<String>, Json(v): Json<Value>) -> Res<(StatusCode, Json<Value>)> {
    need_bot(&app, &id)?;
    let field = |k: &str| v[k].as_str().map(str::trim).filter(|s| !s.is_empty());
    let (Some(name), Some(cron_expr), Some(instruction)) = (field("name"), field("cron"), field("instruction")) else {
        return Err(bad("name, cron, and instruction are required"));
    };
    cron::parse(cron_expr).map_err(bad)?;
    Ok((StatusCode::CREATED, Json(json!(app.db.add_routine(&id, name, cron_expr, instruction)))))
}

async fn update_routine(State(app): State<AppState>, Path(id): Path<String>, Json(v): Json<Value>) -> Res {
    app.db.routine(&id).ok_or_else(|| not_found("Routine"))?;
    let cron_expr = v["cron"].as_str();
    if let Some(c) = cron_expr {
        cron::parse(c).map_err(bad)?;
    }
    app.db.update_routine(&id, v["name"].as_str(), cron_expr, v["instruction"].as_str(), v["enabled"].as_bool());
    Ok(Json(json!(app.db.routine(&id))))
}

async fn delete_routine(State(app): State<AppState>, Path(id): Path<String>) -> Res {
    app.db.routine(&id).ok_or_else(|| not_found("Routine"))?;
    app.db.delete_routine(&id);
    Ok(Json(json!({ "ok": true })))
}
