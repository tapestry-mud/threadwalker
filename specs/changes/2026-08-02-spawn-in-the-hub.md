---
release: unreleased
specs: [threadwalker-world.md]
---

# Spawn In The Hub

## Why

A fresh character could land in the engine's own starting room and never reach Threadwalker
at all. Measured live across three scripted first-contact runs: one never left
`tapestry-core:recall` and `tapestry-core:donation-pit` and saw no Threadwalker room in
eight minutes. It read the game correctly and was defeated by it -- it typed `tapestry`
forty-three times, got "The Tapestry hangs dark. Walk south from the Waystone Hall to find
the school first." every time, and said out loud that it needed to find the Waystone Hall.
"Waystone Hall" appears fifty-seven times in that transcript, every one inside the refusal,
never as a room it could reach.

Two separate causes, both now closed upstream.

The first was that the opener's placement teleport was the only thing moving a fresh
character out of the engine's fallback room -- this spec said as much -- and the hook that
runs it did not always run. Login published `character.created` from a thread-pool thread
into the shared script engine, which could tear the call; when it did, the hook died before
either of its effects, so the player got no opener AND no `recall_room_id`. That is why
`recall`, the documented safety net, returned that character to the core room instead of the
hub. Fixed in the engine (`login-game-entry-on-loop`).

The second is that even when the hook worked, every player still read `tapestry-core:recall`
first. Its description is addressed to engine builders -- "The world beyond feels sparse, a
blank slate waiting for content. If you are building a new MUD, use the `link` command" --
and it rendered before the Weaver opener on every single connect.

## What

`server.yaml` sets `game.spawn_room` to `tapestry-mud-threadwalker:hub-entry`, so the engine
places a brand-new character in the Waystone Hall directly. The core Nexus and its
engine-builder copy are never shown to a player, and the opener now plays in the hub rather
than moving the player there.

This also demotes the opener's teleport from load-bearing to belt-and-braces: placement no
longer depends on any pack script running, so a failure in the opener costs the cutscene,
not the player's route into the game.

Requires engine >= 0.1.57 (the release that added the key). Verified with three consecutive
fresh-character bot runs against a local build: every run's first room was `hub-entry`, no
run entered a `tapestry-core:` room, and the Nexus copy never appeared.
