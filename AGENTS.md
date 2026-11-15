# Open Grok Bot

Open-source, self-hosted alternative to Grok Bot: AI teammates with their own computer, running on any agent harness.

## Rules
- Make all answers very concise. Always answer in short, plain English.
- Stay harness agnostic. Harness-specific code lives only in its adapter.
- "Open Grok Bot" is a temporary name ("Grok" is xAI's trademark). We rename before launch, so keep the name out of code, packages, Docker images, and domains. Use neutral identifiers.
- This repo is public. Put private notes in `private/` (gitignored).
- Record big decisions in `docs/adr/`.
- Skills live in `.agents/skills/`. `.claude/skills` is a symlink to it.
