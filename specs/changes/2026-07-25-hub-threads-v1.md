---
release: 0.2.2
specs: [threadwalker-world.md]
---

# Hub and Threads v1

## Why

Threadwalker shipped as an empty deployable shell. This is its first real content: the smallest
complete roguelite loop - login to first thread to payout to hub - so the game is actually
playable, built on the engine's cutscene player and `@tapestry/oracle`'s template/run machinery.

## What

The v1 world: a small hub (entry, the Tapestry board, a trophy nook, two teaching NPCs); an
authored school that teaches the no-death-pays-zero contract by executing a scripted designed
loss and grants the `tapestry_unlocked` trophy on completion; week one, "The Fraying Vault",
minted at seed 11223344 with a band of 1-10; and the ward gate (a hand-authored hook that places
the dispel staff and tags the run's boss, since the mint bench cannot place tagged content
natively).

The Weaver first-login opener plays a scripted cutscene on a fresh character's first connect and
teleports them into the hub - the only mechanism that gets a new player out of the engine's
hardcoded spawn fallback. The opener also sets the player's `recall_room_id` to the hub on every
connect, so `recall` and the core death handler both bring a threadwalker home rather than to the
engine's default recall pocket.

Depends on engine 0.1.53 (the cutscene player and `world.resetArea`), `@tapestry/core` 0.1.27
(tier-scaled death, the ward gate, pure-gear HP, recall honoring `recall_room_id`), and
`@tapestry/oracle` 0.8.0 (template/run split, the board, the mint bench, per-run teardown).
