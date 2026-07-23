# Security Policy

Threadwalker is a content pack for the Tapestry MUD engine, maintained
under the `tapestry-mud` organization. We take the security of the pack and its
build/publish pipeline seriously. This document explains how to report a
vulnerability and what we do to keep the supply chain safe.

## Reporting a Vulnerability

**Please do not open a public issue or pull request for security problems.**
Public reports tip off attackers before a fix is available.

Instead, report privately through GitHub:

1. Go to this repository's **Security** tab.
2. Click **Report a vulnerability** (GitHub Private Vulnerability Reporting).
3. Describe the issue, the affected version or commit, and steps to reproduce.

If you can include a proof of concept, impact assessment, or suggested fix, that
helps us triage faster -- but it isn't required to file a report.

### What to expect

- **A best-effort acknowledgement within 72 hours** of your report.
- An assessment and, where confirmed, a plan and rough timeline for a fix.
- **Coordinated disclosure:** we develop and release the fix before publishing
  details, then credit you in the advisory unless you'd prefer to remain
  anonymous.

This is a small, fast-moving project, so timelines are best-effort -- but we will
keep you informed.

## Supported Versions

This pack is pre-1.0 and moves quickly. Security fixes are applied to the latest
published version and the `master` branch only.

| Version            | Supported          |
| ------------------ | ------------------ |
| Latest published   | :white_check_mark: |
| `master` (default) | :white_check_mark: |
| Older versions     | :x:                |

## How We Protect the Supply Chain

This repo publishes a content pack to the Tapestry registry and deploys it to a
live server, so a compromised dependency or hijacked CI step could reach
production. Our standing measures:

- **Exact-pinned dependencies.** Every dependency is pinned to an exact version
  -- no `^` or `~` ranges -- so a malicious upstream release can't be pulled in
  silently by a version range.
- **CI actions pinned to commit SHAs.** GitHub Actions are referenced by full
  commit SHA rather than mutable tags, so a retagged or hijacked action can't
  alter our builds or touch the deploy host.
- **Least-privilege CI.** Workflows declare scoped `permissions:` blocks and use
  short-lived, narrowly scoped credentials stored as repository secrets -- not
  long-lived personal access tokens committed to the repo.
- **Reproducible installs.** CI uses `npm ci` against a committed lockfile so
  builds resolve the same dependency tree every run.
- **Protected default branch.** Changes to `master` should require a pull
  request, at least one review, and passing status checks before merge.

## For Contributors

- **Don't introduce unpinned dependencies.** Match the existing exact-version
  pinning. PRs that add `^`/`~` ranges will be asked to pin.
- **Pack scripts run inside the engine.** The JavaScript under `scripts/`
  executes (via Jint) inside the Tapestry engine sandbox when the pack loads.
  Review script changes carefully -- treat any new network calls, file access, or
  surprising behavior as suspect and report it.
- **Never commit live secrets.** Server passwords, SSH keys, and registry tokens
  belong in repository secrets, not in `server.yaml` or workflow files. The
  default `changeme` admin password is a placeholder rotated on first boot via
  the in-game `changepassword` command.

## Scope

**In scope:** this content pack, its build/publish/deploy workflows, and the
config it ships.

**Out of scope:**

- Misconfiguration of a self-hosted deployment running this pack (firewall
  rules, exposed admin ports, weak operator passwords left unrotated, etc.).
- Vulnerabilities in the Tapestry engine, registry, or CLI -- report those in the
  relevant `tapestry-mud` repository.
- Vulnerabilities in upstream dependencies -- report those upstream, though we
  appreciate a heads-up so we can pin around them.

Thank you for helping keep Tapestry and its users safe.
