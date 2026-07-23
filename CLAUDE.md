# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Threadwalker is a Tapestry-native MUD content pack (`type: world`), public reference game and
showcase for the Tapestry engine. It ships as an **empty, deployable shell**: no game content yet,
just `pack.yaml` + the deploy/CI skeleton. The npm package exists only to run Jest; the Tapestry
registry publish happens through `tapestry publish`, not `npm publish` (the npm package is marked
private to block that).

Game content (hub rooms, the Weaver opener, week-one mint, pack capabilities) is authored into
this repo separately -- see the game-hub-threads plan. Until then, `areas/`, `quests/`, `scripts/`,
and `help/` are legitimately empty; the pack's zero rooms still strict-boot because
`@tapestry/core` ships its own default spawn room (`tapestry-core:recall`).

## Commands

Install the Tapestry CLI before running validate or local server commands:

```sh
npm install -g @tapestry-mud/cli@0.13.0   # matches CI validate version
```

| Task | Command |
|------|---------|
| Run all tests | `npm test` |
| Validate pack | `tapestry validate` |
| Local server | `tapestry start` (requires Docker + engine image) |

CI runs `npm ci && npm test && npm run spec-lint && tapestry validate` on every push.

## Layout

```
areas/           YAML rooms, items, mobs -- one subdir per area (empty for now)
quests/          quest YAML (empty for now)
scripts/         JS event hooks loaded by the engine at runtime (empty for now)
help/            help YAML (empty for now)
specs/           capability specs -- authoritative source for all behavior (empty index for now)
specs/changes/   one change record per shipped behavior change
pack.yaml        pack manifest and version -- bumping this triggers publish/deploy
tapestry.yaml    engine and server config synced to the droplet by CI
server.yaml      runtime config (ports, admin handle, LLM settings, telemetry)
```

## Behavior lives in specs

Read `specs/README.md` for the full contract and the capability index. Short version: every
Behavior claim must carry an inline file:line anchor in the form `(path/File.ext:123)` --
specs with no anchors fail `spec-lint`. Shipped behavior changes require a change record in
`specs/changes/`; hotfixes and dep bumps do not. Do not put behavior descriptions in code
comments or READMEs. `specs/lint.config.json` starts in `lenient` mode -- delete the `mode`
line to graduate to strict once real capabilities land.

## Gotchas

**Never hand-edit the droplet.** `tapestry update` on the droplet clobbers all pack files on every
deploy. All changes must go through git and CI.

**Version bump must be the last commit before push.** The publish workflow only fires when
`pack.yaml` is in the changed paths. Committing anything on top of the version bump before pushing
means the path filter does not match and publish/deploy silently skip.

**Public repo, secrets stay env-sourced.** This is a public pack -- nothing in `server.yaml` or
`tapestry.yaml` may carry a live secret. The admin password and LLM API key live in
`/home/deploy/.threadwalker-secrets.env` on the droplet, injected via `tapestry start --env-file`
(see `tapestry.yaml`'s `engine.env_file`), never committed.

**Droplet file ownership.** Everything under `/opt/tapestry/threadwalker` on the droplet must be
owned by the `deploy` user. Wrong ownership causes `tapestry update` to fail with EACCES while
still exiting 0, so the failure is silent.
