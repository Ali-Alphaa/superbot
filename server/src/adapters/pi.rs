//! Pi coding agent CLI: `pi --mode json`. Sessions are files in the Bot's own
//! session dir, addressed by a fixed --session-id, so resuming is the same call.

use super::{describe, new_uuid, str_of, Adapter, AgentEvent, RunInput};
use serde_json::Value;

pub struct Pi;

impl Adapter for Pi {
    fn bin(&self) -> &'static str {
        "pi"
    }

    fn args(&mut self, input: &RunInput, out: &mut Vec<AgentEvent>) -> Vec<String> {
        let id = input.session_id.clone().unwrap_or_else(|| format!("s-{}", new_uuid()));
        out.push(AgentEvent::Session(id.clone()));
        let mut a: Vec<String> = vec![
            "--mode".into(), "json".into(),
            "--session-dir".into(), input.state_dir.join("pi-sessions").display().to_string(),
            "--session-id".into(), id,
            "--append-system-prompt".into(), input.system.clone(),
        ];
        if let Some(m) = &input.model {
            a.extend(["--model".into(), m.clone()]);
        }
        // A leading "@" would make pi read a file, so pad it.
        let p = &input.prompt;
        a.extend(["--".into(), if p.starts_with('@') { format!(" {p}") } else { p.clone() }]);
        a
    }

    fn on_event(&mut self, e: &Value, out: &mut Vec<AgentEvent>) {
        match str_of(e, "type") {
            "message_update" => {
                let m = &e["assistantMessageEvent"];
                if str_of(m, "type") == "text_delta" {
                    out.push(AgentEvent::TextDelta(str_of(m, "delta").into()));
                }
            }
            "message_end" if str_of(&e["message"], "role") == "assistant" => {
                let msg = &e["message"];
                for c in msg["content"].as_array().into_iter().flatten() {
                    if str_of(c, "type") == "text" && !str_of(c, "text").trim().is_empty() {
                        out.push(AgentEvent::Text(str_of(c, "text").into()));
                    }
                }
                if str_of(msg, "stopReason") == "error" {
                    out.push(AgentEvent::Error(msg["errorMessage"].as_str().unwrap_or("Pi failed").into()));
                }
            }
            "tool_execution_start" => {
                out.push(AgentEvent::Tool { name: str_of(e, "toolName").into(), detail: describe(&e["args"]) })
            }
            _ => {}
        }
    }
}
