# Models and platform [docs]

## Models

- No model picker. Grok Bot picks a model per task.
- It can be a first-party xAI model or a third-party provider's model.
- The model used is never shown to the user.
- Usage shows as "Grok Bot usage", not by model.

## Built on Cursor

Grok Bot runs on Cursor's infrastructure. Signs in the docs:

- Usage and billing live on the user's **Cursor account**.
- It draws from the same weekly usage pool as Cursor and the Grok apps.
- OAuth tokens sit on **Cursor's connector backend**.
- Team admin controls live in the Cursor dashboard.
- The app marketplace links to cursor.com.
- Coding work can go to **Cursor Cloud Agents**.
- Data retention follows Cursor's terms.

Some press calls the company "SpaceXAI", formerly xAI.

## Where things run

- **Cloud computer:** one Firecracker microVM per user. See [Computer](computer.md).
- **Outside the VM (stated):** chats and app OAuth tokens.
- **Outside the VM (likely, not stated):** memory, routines, Vault, model inference.
- That split is why a machine reset loses no chats.

## Access and pricing

- Launched in beta on 2026-08-11 (per press coverage).
- **The X Subscription** (where new customers start): included on Premium, Super, and Ultra. Not on Plus or Free.
- **Legacy Cursor plans:** included on every paid plan (Pro, Pro+, Ultra) and Cursor Teams.
- Usage is a weekly pool shared with Cursor and the Grok apps. Past it, prepaid credit or on-demand usage.
- Usage is metered on the Cursor account, not on Grok or X.
- Press reports put it at about $120/month.
- Enterprise has extras: network policy, inference hooks, connector and MCP policy.
