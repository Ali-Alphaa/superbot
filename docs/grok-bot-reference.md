# Grok Bot reference

What we are rebuilding, in our own words. Grok Bot is xAI's "AI teammates" product: beta on Aug 11 2026, v1.0 on Nov 2 2026.

We copy the ideas, never xAI's code, assets, or branding. Our project name is temporary for the same reason: we rename before launch.

## Core ideas

- **Bots**: durable teammates. Each has a name, avatar, label, one chat, and memory that grows over time.
- **Primary Bot**: your main contact. It checks in on its own and coordinates the other Bots.
- **Memory**: each Bot keeps its own rules, preferences, and a dated work log. A few facts (your name, time zone) are shared by all Bots. Bots decide what to remember; you can ask them to remember, fix, or forget.
- **Computer**: one persistent cloud Linux computer per user, shared by all their Bots. Browser, terminal, and files. Sign-ins, cookies, and files persist. Work continues when your laptop is closed.
- **Screens**: each Bot gets its own screen on the shared computer, so Bots work in parallel. You can watch any screen live and take over.
- **Apps first, browser second**: use a connected app (MCP / API) when one exists. Fall back to computer use when it doesn't.
- **Custom tools**: connect any MCP server. A helper Bot can wrap an API into a plugin (MCP server + skills).
- **Vault**: saved logins, cards, and secrets. Order for logins: Vault, then password manager, then a Secure Form to the user. The Bot never sees the secret values.
- **Human handoff**: for SSO, passkeys, CAPTCHAs, QR codes, and bank checks, the Bot hands you the computer.
- **Skills**: reusable instructions for a task. One library shared by all Bots. Can be taught by demonstrating in the browser.
- **Routines**: tell one Bot when to run a workflow. Triggers: schedule, Slack, GitHub, Linear, Sentry, PagerDuty, email, or webhook.
- **Approvals**: Bots ask before sensitive actions, like sending external messages.
- **Channels**: desktop, web, and mobile apps. Slack and Microsoft Teams. Voice calls and voice notes.
- **Teams (v1.0)**: shared Team Bots, permissions, proactive work, learning from the whole team.

## Sources

- https://x.ai/news/introducing-grok-bot
- https://x.ai/news/grok-bot-1-0
- https://docs.x.ai/grok-bot/overview
- https://docs.x.ai/grok-bot/how-grok-bot-works
- https://docs.x.ai/grok-bot/bots
- https://docs.x.ai/grok-bot/computer-and-apps
- https://docs.x.ai/grok-bot/skills-routines-and-automations
