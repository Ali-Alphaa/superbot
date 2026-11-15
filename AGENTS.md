# SuperBot

Open-source, self-hosted alternative to Grok Bot: AI teammates with their own computer, running on any agent harness.

## Rules
- Make all answers very concise. Always answer in short, plain English.
- Rust first. Build as much as possible in Rust: server, adapters, computer daemon, CLI. Use JS/TS/HTML/CSS only where the browser forces it, and keep that layer thin.
- Stay harness agnostic. Harness-specific code lives only in its adapter.
- The project is called SuperBot. Never use "Grok" (xAI's trademark) in our names, code, packages, Docker images, or domains.
- This repo is public. Put private notes in `private/` (gitignored).
- Never commit private details: server IPs, hostnames, domains, local paths (`/Users/...`), emails, usernames, tokens, or keys. Use placeholders like `<server-ip>` and `.env` (gitignored).
- Record big decisions in `docs/adr/`.
- Skills live in `.agents/skills/`. `.claude/skills` is a symlink to it.
