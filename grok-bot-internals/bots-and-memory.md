# Bots and memory

## What a Bot is [docs]

A Bot is a durable AI teammate. It has:

- A name, picture, and label.
- A job.
- Its own conversation.
- Its own memory that grows over time.

Personal Bots have no settings page. You change a Bot by telling it in chat.

Bots work best with one clear job. Example: an expenses Bot.

## The primary Bot [docs]

- The user's main point of contact.
- Checks in on its own.
- Coordinates the other Bots and can hand them work.
- Can create new focused Bots when a job keeps coming back.

## Bots working together [docs]

- Bots can message each other directly.
- Bots can join group chats with each other and with people.
- They pass context through messages, group chats, and shared files on the [computer](computer.md).
- Example: one Bot pulls the week's numbers, another drafts a campaign, a third reviews it, then the user approves.

## Memory [docs]

Each Bot has its own memory. It holds:

- The user's preferences and how they like to work.
- Lasting rules, like "Always ask before you send an email".
- Facts about the user.
- A dated log of past work.

A few facts are shared by **all** of a user's Bots, like name and time zone. Tell one Bot your time zone, and all of them know it.

How it behaves:

- The Bot decides on its own what to save. It doesn't ask first.
- Users can ask it to remember, correct, or forget something in chat.
- There is no memory UI for personal Bots. You ask "What do you remember about me?"
- Memory carries across all chats and voice calls with that Bot.
- In a group chat, a Bot can use what you told it privately. Its memory isn't shared with the other Bots, but they can read what it says.

What resets it:

- Reset a conversation: memory is kept.
- Delete a Bot: its memory is deleted.
- Delete the account: all memory is deleted.

Rules from xAI:

- Memory is not a source of truth. Re-check prices and other changing numbers.
- Logins, cards, and contact info go in [Vault](credentials.md), never in memory.
- Back safety rules with [approvals](approvals.md), not memory alone.

## Sharing [docs]

- **Template:** a copy of a Bot's identity, skills, and routines. Never includes the computer, logins, or chat history.
- **Team Bot:** one Bot many teammates chat with. Each teammate's chat is private.
- A Team Bot in a 1:1 chat usually works on that teammate's computer. In Slack channels and group chats it uses a computer of its own.

## Deleting a Bot [docs]

Deletes its profile, chats, memory, routines, and attachments.

Files and sign-ins on the shared computer stay. They aren't per Bot.
