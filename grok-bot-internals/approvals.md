# Approvals [docs]

## Auto Review

- Checks every action before it runs: commands, app calls, computer use.
- **Model-based.** Not a fixed allowlist.
- On by default. Admins can make it mandatory.
- Most actions run on their own. When one needs the user, the Bot shows an approval card and waits.
- Built-in safety checks always apply, whatever the rules say.
- Turning Auto Review off runs everything unchecked.

## Prompt-injection defense

- Only the user's own messages count as instructions.
- Text from emails, web pages, and files is treated as information.
- Each message the Bot reads is marked as from the user or from someone else.
- xAI says this lowers the risk but doesn't remove it.

## Custom Rules

Users write rules in plain English:

- "Ask first before sending any external email."
- "Allow automatically when running `git status` in `/workspace/reports`."

How they work:

- **Ask first:** always stops a matching action.
- **Allow automatically:** lets it run unless the review finds another reason to stop.
- If both match, **Ask first** wins.
- Up to 20 of each kind. Each up to 1,000 characters.
- Team rules always apply. Personal rules can only make things stricter.

## Approval cards

- **Allow once:** run it now. No rule saved.
- **Always allow:** run it now and save an Allow rule.
- **Deny:** don't run it. The Bot won't retry until the user sends another message.
- Cards can carry warnings like "This can't be undone".
- A card from a chat waits forever.
- A card from a routine or background work expires after **30 minutes**.
- Sending a new message closes open cards in that chat.
- In group chats and Slack, only the person who asked can approve.

## What xAI says to gate

- Sending messages or invites.
- Publishing.
- Purchases and money transfers.
- Deleting or overwriting data.
- Changing permissions.
- Production changes.
- Accepting legal terms.
