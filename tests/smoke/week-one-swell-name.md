# Week One Swell - Name Substitution and Countered-Damage Legibility

Task 15 (S2-20a/S2-20b). Proves two things end to end, using only direct admin
spawn/set-property commands (never a real oracle mint - the fixed-seed
run-prefix check in `wardBossIfPresent` is satisfied by writing the player's
`oracle_active_run` property directly, so this never depends on procedural
dungeon coordinates):

1. `week-one-ward.js`'s `wardBossIfPresent` (scripts/oracle/week-one-ward.js:94)
   substitutes the mob's real (live `.name`) into the swell tell-lines and
   narration, not a hardcoded "the guardian" placeholder. A direct
   `spawn tapestry-oracle:swell-boss` rolls the name "a guardian" (the
   template's own static name - no mint-time LLM dressing applies outside a
   real run), so the proof is the exact overridden string using that live
   name (single-hyphen "STRIKE - sidestep it!" phrasing, lower-case "a
   guardian"), which is textually distinct from the archetype's own baked-in
   default ("The guardian winds up a heavy STRIKE -- sidestep it!" - capital
   "The", double hyphen) - proving the hook's override actually ran rather
   than the template default surviving untouched.

2. `packages/@tapestry/core/scripts/combat/output.ts`'s new
   `entity.vital.changed` listener (reason `combat.swell`) broadcasts a
   condition-band line after a countered swell, using the same band ladder
   as `look`/`combat.hit`. Both `swell_line1_counter` and `swell_line2_counter`
   are pinned to `sidestep` via admin `set` (deterministic regardless of
   which of the two swell lines the engine's internal 50/50 pick chooses),
   so the window announcement and correct counter are fully scripted - no
   reliance on winning a coin flip.

Setup uses `tapestry-test-fixtures:test-arena` (untagged, not `safe`, combat
allowed) plus one `dig`-carved neighbor room so a real directional move
(`east` then `west`) fires `player.direction.moved` with the boss already
standing in the destination room - the same trigger path a real player
walking the mint would take, without needing any procedurally generated
geometry. The Weaver opener cutscene (which plays on a fresh seed login) is
skipped with the cutscene's own `skip` input before setup begins.

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
4. Gamemaster: `dig east`
5. Assert Gamemaster sees: `New Room`
6. Gamemaster: `west`
7. Assert Gamemaster sees: `The Void`
8. Gamemaster: `spawn tapestry-oracle:swell-boss`
9. Assert Gamemaster sees: `Spawned: a guardian`
10. Gamemaster: `set npc swell_line2_counter guardian sidestep`
11. Assert Gamemaster sees: `swell_line2_counter set to sidestep`
12. Gamemaster: `set player oracle_active_run Gamemaster oracle-run-ab4130-smoketest|grind|tapestry-test-fixtures:test-arena`
13. Assert Gamemaster sees: `oracle_active_run set to oracle-run-ab4130-smoketest`
14. Gamemaster: `east`
15. Assert Gamemaster sees: `New Room`
16. Gamemaster: `west`
17. Assert Gamemaster sees: `a guardian is wound in a shimmering ward, thread over thread. Ordinary steel will not reach it.`
18. Gamemaster: `inspect guardian`
19. Assert Gamemaster sees: `req_ward_dispel`
20. Assert Gamemaster sees: `a guardian winds up a heavy STRIKE - sidestep it!`
21. Assert Gamemaster sees: `a guardian rears back for a crushing SLAM - brace for it!`
22. Assert Gamemaster sees: `Clean read. Your counter lands and a guardian staggers.`
23. Gamemaster: `loaditem tapestry-core:staff-of-dispel-ward`
24. Assert Gamemaster sees: `Loaded a staff of dispel ward into your inventory.`
25. Gamemaster: `dispel`
26. Assert Gamemaster sees: `You level a staff of dispel ward. The ward parts with a sound like tearing cloth.`
27. Gamemaster: `inspect guardian`
28. Assert Gamemaster sees: `cap_cleared_ward_dispel`
29. Gamemaster: `kill guardian`
30. Assert Gamemaster sees: `You attack a guardian!`
31. Wait for Gamemaster sees: `An opening! [sidestep]`
32. Gamemaster: `sidestep`
33. Wait for Gamemaster sees: `Clean read. Your counter lands and a guardian staggers.`
34. Wait for Gamemaster sees: `a guardian has a few scratches.`
35. Gamemaster: `purge npc`
36. Assert Gamemaster sees: `Purged`
