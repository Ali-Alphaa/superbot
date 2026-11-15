# Architecture (draft)

Status: proposal. Nothing is decided until it has an ADR in `docs/adr/`.

## Goal

A self-hosted Grok Bot alternative that runs on any agent harness.

## Harness agnostic

The harness is the agent that does the work. We do not build our own agent loop.

Supported harnesses:

1. Claude Code CLI (first)
2. Codex CLI
3. Grok Build
4. Hermes Agent
5. Pi Agent

Each harness has one adapter. An adapter only:

- starts or resumes a session for a Bot
- sends a message in
- streams events out (text, tool calls, approvals, done)
- passes in the Bot's memory, skills, and MCP tools in the harness's own native format

Everything else is shared and never knows which harness is running.

## Proposed parts

- **Web app**: chat with Bots, watch their screen, approve actions.
- **Server**: owns Bots, memory, skills, routines, approvals, and the Vault.
- **Adapters**: one per harness.
- **Computer**: a Docker container on the VPS with a Linux desktop, browser, and terminal. Each Bot gets its own screen.

Language: TypeScript, one repo.

## Open decisions

1. Stack: TypeScript monorepo?
2. One shared computer for all Bots, or one per Bot?
3. v1 chat channel: web, Slack, Telegram, or desktop?
4. Single user, or teams with logins?
5. First end-to-end demo job?
6. Final project name. "Open Grok Bot" is temporary because "Grok" is xAI's trademark. Rename before launch.
