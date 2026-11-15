# Skills and routines [docs]

Two building blocks for repeat work:

- **Skill:** reusable instructions for how to do a task.
- **Routine:** tells one Bot when to run a workflow.

xAI's advice: get the task working once, save it as a skill, then automate it.

## Skills

- One private skill library shared by all the user's Bots.
- Can be enabled per Bot.
- A good skill states: when to use it, inputs and access, steps, how to check the result, what to return, and what needs approval.
- Team users can publish skills to the team. Publishing needs a description, because Bots use it to decide when the skill applies.
- **Teach a task:** the user does a browser workflow once while the Bot records the screen (up to 10 minutes, no audio). The Bot turns it into a draft skill.

## Routines

Created by asking the owning Bot in chat. They run in the cloud with the laptop closed.

Triggers:

- **Schedule**, in plain words ("every weekday at 8:00 AM"). Uses the time zone in settings.
- **Slack:** mention, phrase, reaction, or any message. One channel or all of Slack.
- **GitHub, Linear, Sentry, PagerDuty** events.
- **Email** to the Bot's own address, optionally filtered by sender.
- **Webhook:** POST to a URL with `Authorization: Bearer <key>`. A `200` means the run started, not finished.

Behavior:

- A new routine waits for its next scheduled time. Use **Test** to run it now.
- Only new events count. Old events don't trigger it.
- Test runs do real work.
- Each routine has an **Instruction** and a **When to run**. It can be paused, resumed, edited, or deleted.
- Edits happen through chat: "Edit your routine: ...".
- Approval cards raised by a routine expire after 30 minutes. See [Approvals](approvals.md).
