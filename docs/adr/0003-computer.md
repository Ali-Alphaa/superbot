# 0003: Each Bot's computer is a screen driven by CLI tools

Date: 2026-11-15. Status: accepted.

## Decision

- `botd` gives each Bot its own virtual screen (Xvfb + Openbox), started on demand and stopped when idle.
- Bots use the browser through agent-browser and desktop apps through agent-desktop. Both are CLIs, so every harness can use them without an adapter change. No MCP.
- Each Bot keeps its own browser profile, so its sign-ins persist.
- voxl streams screens to the web app. The user watches, takes over, and answers handoffs.
- We run the screens ourselves (about 150 lines in `screen.rs`) instead of agent-workspace-linux. It is 3 processes, and we need to control their lifecycle and stream ports anyway.

## Why

- These are open source, Rust, and the most used tools of their kind (Nov 2026).
- voxl streams far smoother than noVNC and uses almost no CPU when the screen is still.
- Chrome keeps its sandbox: an AppArmor profile allows it on Ubuntu 23.10+, instead of `--no-sandbox`.

## Limits

- Screens are not security boundaries. All Bots share one Linux user.
- No per-Bot memory limits yet. Swap and earlyoom are the safety net.
