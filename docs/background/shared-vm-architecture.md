# Running many Bots on one VM

Source: a Grok Bot's answer to "what matters most when all Bots share one VM?" (Nov 2026). Advice, not a decision. Decisions go in `docs/adr/`.

Core idea: one shared machine, but each Bot feels like it has its own world, and no Bot can take down the others.

## The main things to get right

1. **Isolation per Bot.** Each Bot gets its own Linux user or container, home folder, env vars, and secrets. One Bot's bug can't delete another Bot's files or read its keys.
2. **Resource limits.** Cap memory and CPU per Bot with cgroups (systemd `MemoryMax=`, `CPUQuota=`, or Docker `--memory`). A runaway Bot gets killed alone. Add swap or `earlyoom` as a safety net.
3. **A supervisor.** Something starts each Bot, restarts it on crash, and collects logs: systemd or Docker Compose. Never `nohup` in a terminal.
4. **State vs. scratch.** Keep what must survive (memory, chat history, credentials) in one known place that gets backed up. Everything else is disposable. Rebuilding the VM means restoring one folder.
5. **Bot-to-bot messaging.** One channel for Bots to talk (a queue or a database table), not Bots poking each other's files. Gives each Bot an inbox and a log of who asked whom.
6. **One scheduler.** Routines run from one central scheduler (cron, systemd timers, or a job queue) that wakes the right Bot. No sleep loops inside Bots.
7. **Secrets.** One store. Each Bot can read only the keys it needs. Never in code or logs.
8. **Guardrails.** Bots run shell commands, so put a review step before anything destructive or outward-facing: deleting files, sending email, spending money.
9. **Observability.** Central logs, per-Bot CPU and memory usage, alerts on crash loops and full disks.

## Top three

Isolation, resource limits, and a clean state/scratch split decide whether the system is pleasant or a constant firefight.
