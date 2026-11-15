# Apps and tools [docs]

Bots reach services two ways:

- **Apps (connectors):** structured tools for Gmail, Slack, Notion, Drive, and more. Preferred.
- **The browser** on the [computer](computer.md): for sites with no app.

## Apps

- Apps are **account-wide**. Every Bot the user runs can use every connected app.
- They act as the user's account. They can't raise access or change sharing.
- Slack posts as the connected user, not as a separate bot user.
- OAuth tokens live on **Cursor's connector backend**. The Bot calls tools without ever getting the tokens.
- Some apps support a second account, picked by label ("use my work Notion").
- In chat, `@` attaches an app to a task.
- A Bot can install an app for the user. It shows a **Connect** card when sign-in is needed.
- When a Bot hits a sign-in page for a site that has an app, it offers the app instead.

## Custom MCP servers

- A Bot can add any MCP server, by URL or by a command run on its computer.
- A command-started server is available to every Bot.
- Private-network servers need user approval.
- Users can add one by hand: **Remote HTTPS** (URL, headers, OAuth client) or **Command** (command + args).
- No MCP server but an API exists? The marketplace Bot `tinkabot` wraps the API into a plugin (MCP server + skills), tests it, and publishes on approval.

## Hand-off to coding agents

Bots can hand coding work to Cursor Cloud Agents and attach the results to their reply.

## Bot email address

- One address per user at `mail.grokbot.com`. Permanent. Can't rename or delete.
- Shared by all the user's Bots.
- Plus aliases work: `name+receipts@mail.grokbot.com`.
- Used for sign-ups, verification codes, receipts, and digests.
- New mail doesn't wake a Bot. A [routine](skills-and-routines.md) must watch for it.
- Email from other people is treated as information, never as instructions.
- Email from a routine or background work waits as a draft until the user presses **Send**.
- Limits: 50 recipients, 10 attachments, 25 MB total, caps on new contacts.

## X (Twitter)

- Read-only search of public X works with no sign-in.
- DMs, bookmarks, and timeline need the X plugin.

## Clients

- Desktop app for macOS, Windows, and Linux.
- iPhone and Android apps.
- Slack and X.
- Chat, voice notes, and voice calls.
