---
release: 0.2.2
specs: [threadwalker-world.md]
---

# Swell Name Substitution

## Why

Playtest finding S2-20a: week one's ward hook already tagged the run's wandering boss and
overwrote its room-visible description, but left its swell tell-lines and narration untouched -
they always read "the guardian" regardless of what name the mob actually rolled, so the QTE text
visibly disagreed with the room's own "[name] is here" listing and the telegraph line the same
hook already builds from the live name.

## What

**Swell tell-line and narration name substitution (threadwalker-world).** `wardBossIfPresent`
now overwrites `swell_line1_tell_full`, `swell_line1_tell_shape`, `swell_line2_tell_full`,
`swell_line2_tell_shape`, `swell_tell_hidden`, and `swell_narration_countered/whiffed/weathered`
on the boss instance using the same `name` variable the hook already uses to build the room
telegraph line, at the same moment it tags the mob `req_ward_dispel` and rewrites its
description. The override is idempotent with the rest of the hook (gated on the same
"not yet tagged" check), so it re-applies cleanly to a fresh instance after a grind-death repop,
same as the tag and description.
