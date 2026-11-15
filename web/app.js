// Thin client: all state lives on the server. Live updates come over /api/events.

// A closed shape from a radius function r(angle), centered in the 48x48 avatar box.
function polar(r, turn = 0) {
  const pts = [];
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const d = r(a);
    pts.push(`${(24 + d * Math.cos(a + turn)).toFixed(2)} ${(24 + d * Math.sin(a + turn)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}
// A regular polygon with rounded corners (k = how round).
const poly = (n, R, k = 0.22) => (a) => {
  const seg = (2 * Math.PI) / n;
  const flat = (R * Math.cos(Math.PI / n)) / Math.cos(((a % seg) + seg) % seg - Math.PI / n);
  return flat * (1 - k) + R * 0.86 * k;
};
const squircle = (a) => 16.5 * Math.pow(Math.pow(Math.abs(Math.cos(a)), 5) + Math.pow(Math.abs(Math.sin(a)), 5), -1 / 5);

// Order matters: the New Bot window shows them in this order.
const SHAPES = {
  round: "M24 5c11.5 0 19 7.5 19 18.5S35 43 23.5 43 5 35.5 5 24.5 12.5 5 24 5z",
  cloud: "M13 14c2-5 7-8 12-7 4 .7 6 3 7 5 6-.5 11 3 11 9 0 7-5 11-12 11-2 4-7 6-12 5-6-1-9-5-9-9-4-1-6-4-5-8 1-4 4-6 8-6z",
  square: polar(squircle, -0.26),
  star: "M24 3c2.6 9.4 6.6 14.2 21 21-14.4 6.8-18.4 11.6-21 21-2.6-9.4-6.6-14.2-21-21C17.4 17.2 21.4 12.4 24 3z",
  flower: polar((a) => 16 + 3.6 * Math.cos(5 * a), -0.3),
  blob: polar((a) => 17 + 2.6 * Math.cos(2 * a + 0.6) + 1.4 * Math.cos(3 * a)),
  scallop: polar((a) => 17 + 1.8 * Math.cos(8 * a)),
  egg: polar((a) => 16.5 + 3 * Math.cos(a + 2.3)),
  wide: "M4 23c0-8.5 9-13.5 20-13.5S44 14.5 44 23s-9 15-20 15S4 31.5 4 23z",
  triangle: polar(poly(3, 22, 0.3), 0.15),
  pentagon: polar(poly(5, 19.5), -0.3),
  splat: polar((a) => 15.5 + 3.4 * Math.cos(7 * a) + 1.2 * Math.cos(2 * a)),
  hexagon: polar(poly(6, 19), 0.3),
};

// ring: draw a selection outline that follows the shape.
function avatar(color, shape = "round", size = 48, ring = false) {
  const d = SHAPES[shape] ?? SHAPES.round;
  const body = `<path d="${d}" fill="${color}"/>
    <rect x="25" y="16" width="3.2" height="7" rx="1.6" fill="#141414" transform="rotate(-18 26.6 19.5)"/>
    <rect x="32" y="15" width="3.2" height="7" rx="1.6" fill="#141414" transform="rotate(-18 33.6 18.5)"/>`;
  return `<svg class="avatar" viewBox="0 0 48 48" width="${size}" height="${size}" style="stroke:none;width:${size}px;height:${size}px;overflow:visible">
    ${ring ? `<path d="${d}" fill="none" stroke="#4a4a4a" stroke-width="2.2" transform="translate(24 24) scale(1.12) translate(-24 -24)"/>
      <g transform="translate(24 24) scale(.86) translate(-24 -24)">${body}</g>` : body}
  </svg>`;
}

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Small, safe Markdown: escape first, then add formatting.
function md(src) {
  const blocks = [];
  let s = esc(src).replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code) => `\u0000${blocks.push(code) - 1}\u0000`);
  const inline = (t) => t
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  return s.split(/\n{2,}/).map((para) => {
    const lines = para.split("\n");
    if (/^\u0000\d+\u0000$/.test(para.trim())) return para.trim();
    if (lines.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*] /, ""))}</li>`).join("")}</ul>`;
    if (lines.every((l) => /^\s*\d+[.)] /.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)] /, ""))}</li>`).join("")}</ol>`;
    const h = para.match(/^#{1,4} (.*)$/);
    if (h && lines.length === 1) return `<p><strong>${inline(h[1])}</strong></p>`;
    return `<p>${lines.map(inline).join("<br>")}</p>`;
  }).join("").replace(/\u0000(\d+)\u0000/g, (_, i) => `<pre><code>${blocks[i]}</code></pre>`);
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// State
let me = { name: "" };
let harnesses = [];
let defaultHarness = "claude";
let bots = [];
const messages = {}; // botId -> array, loaded on first open
const drafts = {}; // botId -> streaming text
let activeId = localStorage.getItem("activeBot");
let filter = "";
let showHidden = false;

const bot = (id) => bots.find((b) => b.id === id);
const primary = () => bots.find((b) => b.primary);

function upsertBot(b) {
  const i = bots.findIndex((x) => x.id === b.id);
  if (i >= 0) bots[i] = { ...bots[i], ...b }; else bots.push(b);
}

// Sidebar
function renderSidebar() {
  const p = primary();
  $("primary-bot").innerHTML = p ? `<div class="avatar-wrap">${avatar(p.color, p.shape, 82)}
    <span class="badge"><svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg></span>
    ${p.unread && p.id !== activeId ? '<span class="unread"></span>' : ""}</div>
    <span>${esc(p.name)}</span>` : "";
  $("primary-bot").classList.toggle("active", p?.id === activeId);

  const q = filter.toLowerCase();
  const list = bots.filter((b) => !b.primary && b.hidden === showHidden)
    .filter((b) => !q || b.name.toLowerCase().includes(q) || (b.preview || "").toLowerCase().includes(q));
  $("bot-list").innerHTML = list.map((b) => `<button class="bot-row ${b.id === activeId ? "active" : ""}" data-id="${b.id}">
      ${avatar(b.color, b.shape, 52)}
      <div class="meta"><div class="name">${esc(b.name)}</div>
        <div class="preview">${b.working ? `<em>${esc(b.status || "Working")}…</em>` : esc(b.preview || "")}</div></div>
      ${b.unread && b.id !== activeId ? '<span class="unread"></span>' : ""}
    </button>`).join("") || (showHidden ? '<div class="empty">No hidden Bots.</div>' : "");

  const hidden = bots.filter((b) => b.hidden).length;
  $("hidden-label").textContent = showHidden ? "Back to Bots" : "Hidden Bots";
  $("hidden-count").textContent = showHidden ? "" : hidden;
  $("me-name").textContent = me.name;
  $("me-avatar").textContent = (me.name || "?")[0].toUpperCase();
}

// Chat
const ACTIONS = `<div class="actions">
  <button title="Copy" data-act="copy"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg></button>
</div>`;

function when(ts) {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = (today - day) / 86400000;
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diff === 0) return `Today ${time}`;
  if (diff === 1) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

function renderMessage(m, prev) {
  let out = !prev || m.at - prev.at > 30 * 60000 ? `<div class="timestamp">${when(m.at)}</div>` : "";
  if (m.role === "routine") return out + `<div class="timestamp routine">Routine · ${esc(m.text)}</div>`;
  if (m.role === "peer" || m.role === "reply") {
    const who = bot(m.fromBot)?.name || "another Bot";
    const label = m.role === "peer" ? `From ${esc(who)}` : `Reply from ${esc(who)}`;
    return out + `<div class="msg-row peer"><div class="bubble"><div class="from">${label}</div>${md(m.text)}</div></div>`;
  }
  if (m.role === "user") return out + `<div class="msg-row user"><div class="bubble">${esc(m.text).replace(/\n/g, "<br>")}</div></div>`;
  if (m.text) {
    out += `<div class="msg-row bot" data-id="${m.id}"><div class="bubble ${m.error ? "error" : ""}">${md(m.text)}</div>${ACTIONS}</div>`;
  }
  if (m.question) {
    const q = m.question;
    out += `<div class="msg-row bot"><div class="bubble question ${q.picked != null ? "answered" : ""}" data-id="${m.id}">
      <h4>${esc(q.title)}</h4>
      ${q.options.map((o, k) => `<button class="option ${q.picked === k ? "picked" : ""}" data-k="${k}">
        <span class="key">${"ABCDEF"[k]}</span>${esc(o)}</button>`).join("")}
    </div></div>`;
  }
  return out;
}

function renderChat(keepScroll) {
  const b = bot(activeId);
  if (!b) { $("messages").innerHTML = ""; return; }
  const el = $("messages");
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  $("bot-pill").innerHTML = `${avatar(b.color, b.shape, 30)}<span>${esc(b.name)}</span><span class="harness">${esc(b.harness)}</span>`;
  $("input").placeholder = `Message ${b.name}`;
  const list = messages[b.id] || [];
  let html = list.map((m, i) => renderMessage(m, list[i - 1])).join("");
  if (b.working) {
    const draft = drafts[b.id];
    if (draft) html += `<div class="msg-row bot"><div class="bubble">${md(draft)}</div></div>`;
    html += `<div class="msg-row bot"><div class="bubble typing"><span></span><span></span><span></span>
      <em class="status">${esc(b.status || "Working")}</em><button class="stop" id="stop">Stop</button></div></div>`;
  }
  el.innerHTML = html;
  if (!keepScroll || atBottom) scrollToBottom(); else updateScrollBtn();
}

function scrollToBottom() {
  const el = $("messages");
  el.scrollTop = el.scrollHeight;
  updateScrollBtn();
}

function updateScrollBtn() {
  const el = $("messages");
  $("scroll-down").classList.toggle("show", el.scrollHeight - el.scrollTop - el.clientHeight > 80);
}

async function open(id) {
  if (!bot(id)) id = primary()?.id;
  if (!id) return;
  activeId = id;
  localStorage.setItem("activeBot", id);
  if (!messages[id]) messages[id] = await api("GET", `/api/bots/${id}/messages`);
  markRead();
  render();
}

function markRead() {
  const b = bot(activeId);
  if (b?.unread && document.hasFocus()) {
    b.unread = false;
    api("POST", `/api/bots/${b.id}/read`).catch(() => {});
  }
}

async function sendText(text, answer) {
  const b = bot(activeId);
  if (!b || !text) return;
  try {
    await api("POST", `/api/bots/${b.id}/messages`, { text, answer });
  } catch (err) {
    alert(err.message);
  }
}

function render(keepScroll) { renderSidebar(); renderChat(keepScroll); renderModelBar(); }

// Model and effort picker above the input. Saved on the Bot, so each Bot keeps its own.
const modelLists = {}; // harness -> Promise<[{id, label, efforts}]>
let modelBarKey = "";
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function renderModelBar() {
  const first = bot(activeId);
  if (!first) return;
  modelLists[first.harness] ??= api("GET", `/api/harnesses/${first.harness}/models`).catch(() => []);
  const list = await modelLists[first.harness];
  const b = bot(activeId); // re-read: the Bot may have changed while loading
  if (!b || b.id !== first.id || b.harness !== first.harness) return;
  const key = [b.id, b.harness, b.model, b.effort, list.length].join("|");
  if (key === modelBarKey) return;
  modelBarKey = key;

  const all = [...new Set(list.flatMap((m) => m.efforts))];
  const models = [{ id: "", label: "Default model", efforts: all }, ...list];
  // A Bot saved with an alias (e.g. "opus") shows as its exact model.
  const isCurrent = (m) => m.id === (b.model || "") || (b.model && m.aliases?.includes(b.model));
  if (b.model && !list.some(isCurrent)) models.push({ id: b.model, label: b.model, efforts: all });
  const current = models.find(isCurrent);
  $("model-select").innerHTML = models.map((m) =>
    `<option value="${esc(m.id)}" ${m === current ? "selected" : ""}>${esc(m.label)}</option>`).join("");
  $("effort-select").innerHTML = ["", ...current.efforts].map((e) =>
    `<option value="${esc(e)}" ${e === (b.effort || "") ? "selected" : ""}>${e ? cap(e) : "Default effort"}</option>`).join("");
  $("effort-select").hidden = !current.efforts.length;
  $("model-bar").hidden = false;
}

async function saveModel(patch) {
  const b = bot(activeId);
  if (!b) return;
  try { upsertBot(await api("PATCH", `/api/bots/${b.id}`, patch)); } catch (err) { alert(err.message); }
  renderModelBar();
}

$("model-select").addEventListener("change", async (e) => {
  const b = bot(activeId);
  const list = await modelLists[b.harness];
  const m = list.find((x) => x.id === e.target.value);
  // Keep the effort only if the new model supports it.
  const effort = m && b.effort && !m.efforts.includes(b.effort) ? null : b.effort;
  saveModel({ model: e.target.value || null, effort });
});
$("effort-select").addEventListener("change", (e) => saveModel({ effort: e.target.value || null }));

// Live updates
function connect() {
  const es = new EventSource("/api/events");
  es.onmessage = (ev) => {
    const e = JSON.parse(ev.data);
    if (e.type === "resync") return void load(true);
    if (e.type === "message") {
      const list = messages[e.message.botId];
      if (list && !list.some((m) => m.id === e.message.id)) list.push(e.message);
      if (e.message.role === "bot") delete drafts[e.message.botId];
      if (e.bot) upsertBot(e.bot);
      if (e.message.botId === activeId) markRead();
    } else if (e.type === "bot") {
      upsertBot(e.bot);
    } else if (e.type === "botDeleted") {
      bots = bots.filter((b) => b.id !== e.botId);
      if (activeId === e.botId) return void open(primary()?.id);
    } else if (e.type === "draft") {
      drafts[e.botId] = e.text;
    } else if (e.type === "status") {
      const b = bot(e.botId);
      if (b) { b.working = e.working; b.status = e.status; }
      if (!e.working) delete drafts[e.botId];
    }
    render(true);
  };
  // Resync after a reconnect, in case events were missed.
  let opened = false;
  es.onopen = () => { if (opened) load(true); opened = true; };
}

async function load(refresh) {
  const state = await api("GET", "/api/state");
  me = state.me;
  harnesses = state.harnesses;
  defaultHarness = state.defaultHarness;
  bots = state.bots;
  if (refresh) for (const id of Object.keys(messages)) messages[id] = await api("GET", `/api/bots/${id}/messages`);
  await open(activeId);
}

// Events
$("bot-list").addEventListener("click", (e) => {
  const row = e.target.closest(".bot-row");
  if (row) open(row.dataset.id);
});
$("primary-bot").addEventListener("click", () => open(primary()?.id));

$("messages").addEventListener("click", (e) => {
  if (e.target.closest("#stop")) return void api("POST", `/api/bots/${activeId}/stop`).catch(() => {});
  const copy = e.target.closest('[data-act="copy"]');
  if (copy) {
    const m = messages[activeId]?.find((x) => x.id === +copy.closest(".msg-row").dataset.id);
    if (m) navigator.clipboard.writeText(m.text);
    return;
  }
  const opt = e.target.closest(".option");
  if (!opt) return;
  const card = opt.closest(".question");
  const m = messages[activeId]?.find((x) => x.id === +card.dataset.id);
  if (!m || m.question.picked != null) return;
  m.question.picked = +opt.dataset.k;
  render(true);
  sendText(m.question.options[m.question.picked], { messageId: m.id, option: m.question.picked });
});

$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("input").value.trim();
  if (!text) return;
  $("input").value = "";
  sendText(text);
});

// New Bot window
const COLORS = ["#f5f5f5", "#9a6b3f", "#e5484d", "#e8702e", "#e9a23b", "#4cc06a", "#4fb5a5", "#3b82f6", "#8b5cf6", "#e64a9c", "#7a7a7a"];
const HARNESS_NAMES = { claude: "Claude Code", codex: "Codex", pi: "Pi" };
const nb = { color: COLORS[0], shape: "round", harness: "claude" };
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

function renderNewBot() {
  $("nb-preview").innerHTML = avatar(nb.color, nb.shape, 150);
  $("nb-shapes").innerHTML = Object.keys(SHAPES).map((s) =>
    `<button type="button" class="nb-shape" data-shape="${s}" title="${s}">${avatar(nb.color, s, 60, s === nb.shape)}</button>`).join("");
  $("nb-colors").innerHTML = COLORS.map((c) =>
    `<button type="button" class="nb-color ${c === nb.color ? "on" : ""}" data-color="${c}" style="background:${c}" title="${c}"></button>`).join("");
  const list = harnesses.length ? harnesses : Object.keys(HARNESS_NAMES);
  $("nb-harness").innerHTML = list.map((h) =>
    `<option value="${h}" ${h === nb.harness ? "selected" : ""}>${HARNESS_NAMES[h] || h}</option>`).join("");
  $("nb-create").disabled = !$("nb-name").value.trim();
}

function openNewBot() {
  Object.assign(nb, { color: pickOne(COLORS), shape: pickOne(Object.keys(SHAPES)), harness: defaultHarness });
  $("nb-name").value = "";
  $("nb-error").hidden = true;
  renderNewBot();
  $("nb").hidden = false;
  $("nb-name").focus();
}
const closeNewBot = () => { $("nb").hidden = true; };

$("new-btn").addEventListener("click", openNewBot);
$("nb-close").addEventListener("click", closeNewBot);
$("nb-cancel").addEventListener("click", closeNewBot);
$("nb").addEventListener("mousedown", (e) => { if (e.target === $("nb")) closeNewBot(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("nb").hidden) closeNewBot(); });
$("nb-name").addEventListener("input", () => { $("nb-create").disabled = !$("nb-name").value.trim(); });
$("nb-form").addEventListener("click", (e) => {
  const t = e.target.closest("[data-shape], [data-color]");
  if (!t) return;
  if (t.dataset.shape) nb.shape = t.dataset.shape;
  if (t.dataset.color) nb.color = t.dataset.color;
  renderNewBot();
});
$("nb-harness").addEventListener("change", (e) => { nb.harness = e.target.value; });
$("nb-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("nb-name").value.trim();
  if (!name) return;
  $("nb-create").disabled = true;
  try {
    const b = await api("POST", "/api/bots", { name, color: nb.color, shape: nb.shape, harness: nb.harness });
    upsertBot(b);
    closeNewBot();
    open(b.id);
  } catch (err) {
    $("nb-error").textContent = err.message;
    $("nb-error").hidden = false;
    $("nb-create").disabled = false;
  }
});

// Bot details: click the name at the top of the chat.
$("bot-pill").addEventListener("click", async () => {
  const b = bot(activeId);
  if (!b) return;
  const choice = prompt(
    `${b.name} runs on ${b.harness}${b.model ? ` (${b.model})` : ""}.\n\nType a new name to rename it, or one of:\n` +
    `  ${b.hidden ? "show" : "hide"}\n  agent <${harnesses.join("|")}>\n  model <name>  (empty = default)\n${b.primary ? "" : "  delete\n"}`,
  )?.trim();
  if (!choice) return;
  const [cmd, ...rest] = choice.split(/\s+/);
  const arg = rest.join(" ");
  try {
    if (cmd === "delete" && !b.primary) {
      if (confirm(`Delete ${b.name}? This erases its chat, memory, and routines. Files on the computer stay.`)) {
        await api("DELETE", `/api/bots/${b.id}`);
      }
    } else if (cmd === "hide" || cmd === "show") upsertBot(await api("PATCH", `/api/bots/${b.id}`, { hidden: cmd === "hide" }));
    else if (cmd === "agent") upsertBot(await api("PATCH", `/api/bots/${b.id}`, { harness: arg }));
    else if (cmd === "model") upsertBot(await api("PATCH", `/api/bots/${b.id}`, { model: arg || null }));
    else upsertBot(await api("PATCH", `/api/bots/${b.id}`, { name: choice }));
    render(true);
  } catch (err) { alert(err.message); }
});

$("hidden-btn").addEventListener("click", () => { showHidden = !showHidden; renderSidebar(); });
$("search-btn").addEventListener("click", () => {
  const s = $("search");
  s.hidden = !s.hidden;
  if (!s.hidden) s.focus(); else { filter = ""; s.value = ""; renderSidebar(); }
});
$("search").addEventListener("input", (e) => { filter = e.target.value; renderSidebar(); });
$("messages").addEventListener("scroll", updateScrollBtn);
$("scroll-down").addEventListener("click", () => $("messages").scrollTo({ top: $("messages").scrollHeight, behavior: "smooth" }));
window.addEventListener("focus", () => { markRead(); renderSidebar(); });

load().then(connect).catch((err) => { $("messages").innerHTML = `<div class="timestamp">Can't reach the server: ${esc(err.message)}</div>`; });
