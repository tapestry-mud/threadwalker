---
capability: threadwalker-world
last-updated: 2026-07-28
---

# Threadwalker World

## Overview

Threadwalker is the roguelite hub-and-threads game: a small hub, an authored school that teaches
the no-death-pays-zero contract by executing a designed loss, and week-one content ("The Fraying
Vault") minted on `@tapestry/oracle`'s template/run machinery. This capability covers the
world-specific scripting that carries mechanics - the Weaver first-login opener, the school quest,
the designed loss, and the week-one ward gate. Rooms, NPCs, and items are content data authored in
YAML; the behavior below is what the scripts do.

## Behavior

### The Weaver opener + recall wiring

- On `character.created` (first-ever connect) and `player.login`, the opener sets the player's
  `recall_room_id` to the hub entry and, if unseen, plays the Weaver cutscene.
  (scripts/hooks/weaver-opener.js:106; scripts/hooks/weaver-opener.js:37)
- `tapestry.cutscene.play` runs the paced beat sequence; its `onComplete` marks
  `weaver_opener_seen` and teleports the player to `hub-entry`. This teleport is the ONLY thing
  that moves a fresh character out of the engine's hardcoded `tapestry-core:recall` spawn
  fallback; `weaver_opener_seen` is set only in `onComplete`, so a mid-opener disconnect replays
  cleanly instead of stranding the player. (scripts/hooks/weaver-opener.js:66;
  scripts/hooks/weaver-opener.js:74)
- Setting `recall_room_id` on every connect (not just in `onComplete`) means `recall` and the
  core death handler both return the player to the hub even if the opener never completes.
  (scripts/hooks/weaver-opener.js:39)

### The school - designed loss and the unlock

- The lesson mob cannot be beaten: its `onAttack` hook fires once, synchronously inside combat
  engage, and calls `removeFromAllCombat` + `restoreVitals` before any damage resolves, so
  `entity.vital.depleted` never publishes and the core death path is never invoked - a guaranteed
  loss that pays out rather than killing. (scripts/mobs/the-lesson.js:18)
- The mob's reaction, loss narration, and aftermath-room transition are deferred by one engine
  tick (`tapestry.schedule.every(1, ...)`, mirroring the Weaver opener's own one-tick defer),
  while `removeFromAllCombat`/`restoreVitals` stay synchronous. `onAttack` runs inside
  `combat.engage()` itself, and the shared attack handler
  (`@tapestry/core` `scripts/combat/commands.ts`) only sends the attacker's own "You attack the
  lesson!" confirmation after `engage()` returns - without the defer, the loss narration and room
  transition printed before the player's own attack line ever did. (scripts/mobs/the-lesson.js:36;
  scripts/hooks/weaver-opener.js:93)
- Completing the school quest sets `tapestry_unlocked`, the one v1 trophy that opens the Tapestry
  board. (scripts/quests/school.js:16)

### Week-one ward gate

- The mint bench cannot place a tagged mob or item natively (a documented `@tapestry/oracle` gap),
  so week one's ward is a hand-authored hook scoped to this week's run slug. On
  `player.direction.moved` it places the `cap_ward_dispel` staff in the first room entered and
  tags the run's wandering boss with `req_ward_dispel`, both idempotent and re-applied after a
  grind-death repop. (scripts/oracle/week-one-ward.js:114; scripts/oracle/week-one-ward.js:85;
  scripts/oracle/week-one-ward.js:108)
- The same tagging pass substitutes the boss's live `.name` into its swell tell-lines
  (`swell_line1/2_tell_full/shape`, `swell_tell_hidden`) and narration
  (`swell_narration_countered/whiffed/weathered`), overwriting the archetype's hardcoded "the
  guardian" placeholder text so the QTE reads as the actual mob the room-listing and telegraph
  line already name it as, not a mismatched generic label. (scripts/oracle/week-one-ward.js:94-118)

## Rejected and Reverted

- None on record.

## Change Log

- 2026-07-27 [swell-name-substitution](changes/2026-07-27-swell-name-substitution.md) - the week-one ward hook substitutes the boss's live name into its swell tell-lines and narration instead of a hardcoded "the guardian" placeholder
- 2026-07-25 [hub-threads-v1](changes/2026-07-25-hub-threads-v1.md) - the v1 world: hub, the school (designed loss + unlock), week one (The Fraying Vault) + the ward gate, and the Weaver first-login opener with hub recall wiring
