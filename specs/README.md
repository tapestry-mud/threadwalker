# Threadwalker -- specs

Capability specs for Threadwalker. Public-distilled mode: this is a public repo, so change
records and specs stay technical -- implementation rationale only, no business/roadmap context
that doesn't belong in the open (contrast `legends-forgotten`, which is private and runs
private-full).

No capabilities yet -- this repo is an empty, deployable shell. Content lands via a separate
plan; each capability gets a spec here as it ships.

## Index

| Capability | File | Last Updated |
|------------|------|--------------|

<!-- spec-lint:start -->
Mode: lenient

Required sections: Overview, Behavior, Rejected and Reverted, Change Log

Anchor regex (Behavior): \([@\w./\\-]+\.(cs|js|ts|json|ya?ml|md)(:\d+(-\d+)?)?[^)]*\)

Empty-reversal sentinel: - None on record.

Change Log: list, newest-first by date, not a table. Empty is valid for unmodified capabilities.

Index sync: every capability .md on disk appears in README index; every indexed file exists on disk; index date matches file last-updated.

Currency: for each change record naming a capability, the top Change Log entry references that record and last-updated >= record date. A capability named by zero records may have an empty Change Log.

Tombstone: a change record with status:reverted requires a tombstone entry in the capability Rejected and Reverted (not the empty sentinel).
<!-- spec-lint:end -->
