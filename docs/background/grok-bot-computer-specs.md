# Grok Bot computer: observed specs

Source: a Grok Bot describing its own computer when asked (Nov 2026). Self-reported, not verified.

## Specs

- OS: Debian 13 (trixie), Linux 6.12, x86_64
- CPU: 8 cores, Intel Xeon, 1 thread per core, AVX2 and AVX-512
- RAM: 15 GB, no swap. About 13 GB in use, about 2 GB free.
- Disk: 128 GB virtual disk (`/dev/vdb`), 8 GB used
- GPU: none
- Runs inside a container. Uptime was about 15 hours.

## What this tells us

- It is a modest dev box, not a powerhouse.
- All of a user's Bots share this one computer. That likely explains the high memory use.
- RAM is the bottleneck. With no swap, a big build or local model can be killed for running out of memory.
- CPU and disk have plenty of room.

For us: a mid-size VPS is enough, but we need memory limits per Bot. See [shared-vm-architecture.md](shared-vm-architecture.md).
