# Request lifecycle [docs]

xAI's own walkthrough of one request. It shows how the pieces fit.

Request to an expenses Bot:

> Sign me up for the same conference as last year and expense it.

## 1. Memory fills the gaps

The message doesn't say which conference, pass, or card. The Bot's work log has last year's 2-day pass. It also has a rule: use the work card for conferences. See [Bots and memory](bots-and-memory.md).

## 2. A connected app finds the receipt

The Bot searches Gmail through the Gmail app, not the website. Apps are more reliable than clicking around a browser. See [Apps and tools](apps-and-tools.md).

## 3. The computer buys the pass

The conference site has no app, so the Bot opens it in the browser on its [cloud computer](computer.md).

It needs a login. It checks, in order:

1. Vault.
2. 1Password.
3. A Secure Form sent to the user.

The login is filled into the page. The Bot never sees it. Payment uses the card saved in Vault. See [Credentials](credentials.md).

## 4. Auto Review stops before emailing finance

The user has an "Ask first" rule for sending email. The Bot shows an approval card and waits. See [Approvals](approvals.md).

## 5. It logs the expense and reports back

The Bot adds a row to a Finance sheet in Google Drive. Then it replies with what it did.

If the user's laptop is closed, the work keeps going in the cloud. The user gets a notification when it's done.

## Identity

- A Bot has no account of its own. It acts **as the user**.
- It can't do anything the user couldn't. Every action traces back to the user.
- Exception: a team-managed connector can use a service account.
