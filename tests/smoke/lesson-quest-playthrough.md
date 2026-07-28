# The Lesson - Real Quest Playthrough (S2-8 follow-up check, not asserted as a fix)

Task 21 Step 3's "manually play through once" check. Walks the real hub -> school path (not
the isolated spawn/teleport used in lesson-attack-ordering.md) so the quest is actually granted
and actually completes, to observe the real end-to-end line order including the reward dispatch
and school.js's onCompleted narrative line. This is exploratory/documentation only - the S2-8
code fix under test is the attack-confirmation ordering (already proven in
lesson-attack-ordering.md); this scenario exists to honestly check the brief's separate
"item-grant message" sub-finding, not to assert a pass/fail on it.

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
2. Gamemaster: `teleport Gamemaster tapestry-mud-threadwalker:hub-entry`
3. Assert Gamemaster sees: `Waystone Hall`
4. Gamemaster: `south`
5. Assert Gamemaster sees: `The First Thread`
6. Gamemaster: `south`
7. Assert Gamemaster sees: `A Narrow Weave`
8. Gamemaster: `south`
9. Assert Gamemaster sees: `The Lesson Hall`
10. Gamemaster: `kill lesson`
11. Assert Gamemaster sees: `You attack the lesson!`
12. Wait for Gamemaster sees: `After the Weave`
13. Wait for Gamemaster sees: `hand closes on something real`
