# Credentials [docs]

Core idea: secrets go into the page or the tool, never to the model.

## Login order

When a site needs a password, the Bot tries:

1. **Vault:** logins the user saved for their Bots.
2. **1Password:** the user approves each login in 1Password. Only the Personal vault works.
3. **Secure Form:** the Bot asks the user. The value is filled into the page directly.

In all three, the Bot never sees the password.

## Other secret types

- **API keys:** a secure secret card. Masked, kept out of the transcript, not shown to the model.
- **One-time codes:** read from connected Gmail or Outlook, or from the Bot's own inbox.
- **App sign-ins:** OAuth tokens stay on the backend. See [Apps and tools](apps-and-tools.md).
- **Hardware keys:** the Bot's browser can use a YubiKey plugged into the user's desktop. Each use needs approval.

## Payments

- Card saved in Vault: fills at checkout with no extra approval.
- Card entered in a Secure Form, or wallets like Link, X Money, and Shop Pay.
- Want to approve every payment? Don't save the card.
- Caveat: in the Grok Bot app, a Bot **can** see a saved card's number and security code so it can type them.

## Human takeover

Some steps need the user:

- Single sign-on or passkeys.
- CAPTCHAs the Bot can't pass.
- Approvals on another device, or QR codes.
- Bank card verification.
- Sites that require a human.

Flow:

1. User opens the computer and chooses **Take control**.
2. User does only the blocked step.
3. User chooses **I'm done** and tells the Bot to continue.

## Caveat

Everything signed in on the [computer](computer.md) is shared. When one Bot signs in, all of the user's Bots are signed in. Vault items are usable by every Bot too.
