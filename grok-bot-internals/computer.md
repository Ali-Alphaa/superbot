# Computer

Every Grok Bot user gets one persistent Linux machine in the cloud. All their Bots work on it.

## Specs [observed]

A Bot reported these specs from its own machine. Screenshot: [assets/computer-specs.png](assets/computer-specs.png).

- **OS:** Debian 13 (trixie), Linux kernel 6.12, x86_64.
- **CPU:** 8 cores of Intel Xeon. 1 thread per core, so 8 threads. Has AVX2 and AVX-512.
- **RAM:** 15 GB. No swap. About 13 GB was in use, so only ~2 GB was free.
- **Disk:** 128 GB virtual disk at `/dev/vdb`. 8 GB used, 120 GB free.
- **GPU:** none.
- **Uptime:** about 15h 42m when checked. The machine stays on between tasks.

The Bot's own read:

- It's a solid dev machine, not a powerhouse.
- RAM is the bottleneck. A big build or a local model could get OOM-killed.
- All the user's Bots share this machine, which likely explains the high memory use.

## Virtualization [docs]

- Each machine is a **Firecracker microVM** with its own kernel, memory, and virtual devices.
- Each user's machine is dedicated and hardware-isolated. One user can't reach another's.

The Bot said it "runs inside a container". The docs say microVM. The virtio disk (`/dev/vdb`) fits a microVM, so trust the docs.

## Shared by all of a user's Bots [docs]

The machine belongs to the user account, not to a Bot. So:

- Browser cookies and sign-ins are shared. Sign in once, and every Bot is signed in.
- Files are visible to every Bot.
- Command-line credentials are shared.
- One Bot can pick up work another Bot saved.

Bots isolate personalities and workspaces, not compute. If a workload needs its own machine and credentials, it needs its own user account.

## One screen per Bot [docs]

- Each Bot gets its own screen on the shared machine.
- Several Bots can drive the browser and desktop at the same time.
- One Bot runs one computer-use task at a time.
- Screens are work surfaces, not security boundaries.
- The user can watch any screen live, or take control.

## Files and persistence [docs]

- Shared workspace at `/workspace`. Durable project files go there.
- Files, browser state, and sign-ins survive updates and recovery.
- Grok Bot keeps a durable copy of synced data and restores from it.
- Not saved: temp dirs, manually installed packages, `node_modules`, Python venvs.
- Conversation history is stored **outside** the machine. Even `rm -rf` or a full reset doesn't delete chats.
- When disk is nearly full, the Bot names the biggest files and offers to delete them. It deletes only on a yes.

## Update, recover, reset [docs]

- **Update:** either a software-only refresh (keeps everything) or a full machine swap (keeps Bots, files, logins; drops installed packages).
- **Recover:** saves what it can, then rebuilds a fresh machine from saved data.
- **Reset:** rebuilds a fresh machine from the last saved data.
- Recover and reset interrupt running work and drop installed packages.
- The desktop app and the machine update separately.

## The user's own computer is separate [docs]

- Bots can also run commands on the user's Mac or Windows machine.
- Off unless enabled. Default policy is **Ask every time**. Options: Always allow, Never allow.
- This policy is separate from the approvals for the cloud machine.
