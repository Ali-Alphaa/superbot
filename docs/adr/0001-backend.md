# 0001: Backend is one Rust binary that drives harness CLIs

Date: 2026-11-15. Status: accepted.

## Decision

- The server is one Rust binary (`botd`) with SQLite. The web app is embedded in it.
- Bots run on harness **CLIs** (Claude Code, Codex, Pi) in JSON-stream mode. We don't write our own agent loop.
- One adapter file per harness. The rest of the server never knows which harness runs.
- Memory is Markdown files the Bot edits itself, re-sent in the system prompt every run.
- Bots manage routines through `botctl`, a CLI any harness can call from its shell.

## Pi Durable

We looked at `@earendil-works/pi-durable`. It is a TypeScript library, not a CLI: a durable agent runtime with crash-safe conversations, sleeping tasks, and hooks. We don't embed it now because:

- It is marked experimental, and its API changes without notice.
- Embedding it means owning model setup and tools in TypeScript, against our Rust-first and no-own-agent-loop rules.

We use the `pi` CLI instead, like the other harnesses. We borrowed Pi Durable's ideas: save before showing, keep work going when the browser disconnects, and resume queued work after a crash.
