# The Lesson - Attack Confirmation Ordering (S2-8)

Task 21. Proves the attacker's own "You attack the lesson!" confirmation
(sent by @tapestry/core's shared attack handler,
`packages/@tapestry/core/scripts/combat/commands.ts`, only after
`tapestry.combat.engage(...)` returns) now prints BEFORE the lesson's
designed-loss narration and room transition, not after.

`onAttack` (scripts/mobs/the-lesson.js) fires synchronously inside
`combat.engage()` itself (`CombatManager.Engage` calls `AddToCombatList` then
synchronously `EventBus.Publish("combat.engage", ...)`, which dispatches
straight to `onAttack` via `onattack-dispatch.ts` - no tick boundary in
between). Before this task's fix, `onAttack` sent its loss narration and
room transition immediately, in that same synchronous call, so they always
beat the attacker's own confirmation line (which the shared handler can only
send once `engage()` returns). The fix defers the loss narration, mob
reaction, and room transition by one engine tick
(`tapestry.schedule.every(1, ...)`, mirroring
`scripts/hooks/weaver-opener.js:93-101`'s existing defer pattern), while
`removeFromAllCombat`/`restoreVitals` stay synchronous (removing that safety
net by even one tick would let the engine's own per-tick auto-attack phase
resolve real damage before the designed loss is cut short).

Setup uses direct admin `teleport`/`spawn` into
`tapestry-test-fixtures:test-arena` (untagged, not `safe`, combat allowed) so
this proves the ordering fix in isolation, without depending on the quest
gate, the school area layout, or any procedural content. The Weaver opener
cutscene (plays on a fresh seed login) is skipped with `skip` before setup,
same pattern as `tests/smoke/week-one-swell-name.md`.

The key assertion is the negative one (step 6): right after `kill lesson`,
before any further tick elapses, the loss narration must NOT be visible yet
-- only the attack confirmation. That is the actual regression proof: on the
pre-fix code, step 6 fails because the narration is already in the buffer
(it was sent synchronously, before `engage()` even returned to send the
confirmation).

## Setup
- Players: Gamemaster

## Login
### Gamemaster
1. Wait for: `Speak your name`
2. Send: `Gamemaster`
3. Wait for: `Password`
4. Send: `testpass123`
5. Wait for: `Welcome`
6. Wait for: `The Weaver stands at the Tapestry`
7. Send: `skip`

## Steps
1. Gamemaster: `skip`
2. Gamemaster: `teleport Gamemaster tapestry-test-fixtures:test-arena`
3. Assert Gamemaster sees: `The Void`
4. Gamemaster: `spawn tapestry-mud-threadwalker:the-lesson`
5. Assert Gamemaster sees: `Spawned: the lesson`
6. Gamemaster: `kill lesson`
7. Assert Gamemaster sees: `You attack the lesson!`
8. Assert Gamemaster does not see: `does not fight back so much as it happens to you`
9. Wait for Gamemaster sees: `does not fight back so much as it happens to you`
10. Assert Gamemaster sees: `After the Weave`
