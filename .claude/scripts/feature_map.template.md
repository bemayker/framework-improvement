<!-- materialized-from: mayker-dev v0.3.167; do not edit, regenerate with /upgrade-project -->
<!--
  CANONICAL TEMPLATE — this file is the single source of truth for the shape of
  `.claude/feature_map.md`. `/sync-project` (Section 4) and `/deliver` (Section 2
  step 5) materialize it verbatim, then append one row per work item. Do not
  restate the column set anywhere else; reference this file instead.

  Materialization contract (same as templates/CLAUDE.md and templates/settings.json):
  copy verbatim -> keep the schema block below -> append rows -> delete this
  leading comment in the output -> write the version stamp as the output's first
  line.

  The stamp is one line: an HTML comment whose content is exactly

    materialized-from: mayker-dev v{VERSION}; structure is the plugin's, rows are
    this project's own data: edit rows by hand, or re-run /sync-project

  with {VERSION} read from the installed plugin.json, and the whole thing on a
  single line. The literal comment delimiters are deliberately NOT spelled out
  inside this block: a nested comment close would end the block right here, and
  every generator would then copy the rest of these instructions into the map.
  `/sync-project` Section 4 shows the finished line, and
  `hooks/lib/feature-map-repair.sh` writes exactly the same one when it repairs
  an older map.

  The stamp is DIAGNOSTIC ONLY (MDF-059): nothing reads it to decide anything,
  and it carries no "do not edit" clause, unlike the seven stamped rules and the
  vendored validator pair, because the ROWS below are the project's own data. It
  exists so a map can say which plugin version shaped its structure.

  Nothing re-materializes an existing map's structure: /sync-project Section 10
  preserves rows and does not rewrite the scaffolding, and /deliver Section 2
  skips setup entirely once project_state.json exists. So a map written before
  this file gained `## Schema` and `## Work items` stays invalid forever, and the
  heal for it is `hooks/lib/feature-map-repair.sh <path>` — named by migration
  entry `0.3.107-01-feature-map-structure` — never a hand edit of the table.
-->

# Feature Map, Dependencies

This file is the project's **dependency graph**: one row per work item, edges in
`depends_on`. Agents read it to determine what blocks an item and which branch to
use. Readiness is *computed*, never stored here: an item is ready when all of its
`depends_on` are Done (`.claude/rules/work_items.md` Section 7). Independent items
can run in parallel. The `wave` column groups them for a human — an **authored**
ordering key, never a gate and never a status (see `wave` below).

Status is **not** in this file. It lives in the issue tracker via MCP for
`tracker`/`hybrid` source, or in each item's frontmatter under `docs/issues/` for
`local` source. With `local` source this table may be empty or absent entirely:
local items carry `depends_on` and `branch` in their own frontmatter.

To update: re-run `/sync-project`, re-run `/deliver`, or edit rows by hand.

## Schema

Exactly eight columns, in this order. Every row must have all eight cells
(trailing cells may be empty, the pipes may not be omitted).

Enforced, not just documented: `bash .claude/scripts/feature-map-validate.sh {path}`
validates a written map against **this** table (it reads the column set from here, so
this file stays the only definition) and exits non-zero on any violation. Every
generator runs it and stops on failure; the `feature-map-guard` PostToolUse hook
re-runs it on any other write; and the `feature-map` job in `pr-tests.yml` runs it on
every pull request, so a row edited by hand and pushed is checked too. That last one
is why the script is **vendored** into `.claude/scripts/` rather than read from
`~/.mayker/mayker-dev/hooks/lib/feature-map-validate.sh`: the plugin installs under
`~/.claude/`, which no CI runner has. Inside a Claude session either path works.

| Column | Required | Format | Notes |
| --- | --- | --- | --- |
| `Feature ID` | yes | tracker ID or `US-###` / `BUG-###` / `MDF-###` | Must be unique. Matches the ID the tracker MCP resolves. |
| `Title` | yes | free text, no pipes | Escape any literal `\|`. |
| `depends_on` | yes | `[]` or `[ID]` or `[ID, ID]` | **Direct** dependencies only, never transitive. Literal `[]` when none, never blank. No cycles. |
| `branch` | yes | `feature/{Feature ID}-{slug}` | The `feature/{ID}` prefix is a hard requirement: the auto-Done pipeline matches it on merge. Slug is lowercase, hyphenated, max 40 chars. |
| `scaffold` | no | `✅` or empty | At most one row may be flagged. `new` mode only. The literal `scaffold: true` form is for local frontmatter, **not** this column. |
| `shared_risk_notes` | no | `⚠️ {note}` or empty | **Derived, never authored.** Flags independent items likely to touch the same files. Flag both rows of a pair. Serialize rather than run these concurrently. Every route that writes rows infers it over the rows whose cell is still empty and appends to — never replaces — a cell that already carries a note; an empty cell means "not yet inferred", not "no overlap", so the run report says which (`work_items.md` Section 7). |
| `test_checkpoint` | no | `✅` or empty | **Authored, never derived.** Marks an item whose merge is a boundary worth running the whole local suite at. **Any number of rows may be flagged**, unlike `scaffold`. See below. |
| `wave` | no | a positive integer, or empty | **Authored, never derived at read time.** The human's sequencing intent: which items form one front. Numbers need not be contiguous. Empty means *unwaved* — the row sorts after every waved row and renders under `Unwaved`. Every `depends_on` of a waved row must itself be waved, with a **strictly smaller** wave. See below. |

### `test_checkpoint`, the boundary the graph cannot express

The push-time gate runs a **scoped** suite on a `feature/{ID}-{slug}` branch (the
item's dependant closure, `CLAUDE.md` → `Scoped test command:`), and CI runs
everything against one PR at a time. Neither ever runs the whole suite against a
**locally integrated** main. The `wave` column below does not supply it either:
a wave says which items a human wants taken together, not that a line of work is
finished, and it carries no status (`work_items.md` Section 7). The graph says
what blocks what, and nothing in it says "this group of work is complete".

This column says it. Flag the item whose merge closes a meaningful group, and the
full suite runs once at that point:

- **Assisted, single item:** `/build-feature` Section 4 reports the outcome and
  builds anyway. Advisory.
- **Assisted, batch:** `/build-features` runs it at refill and once before the
  report, per batch and never per item. Advisory.
- **Autonomous:** `/deliver` 6.10 runs it post-merge, **before** admitting any
  newly unblocked item, and admits nothing further on red.

`/sync-project` and `/deliver` **propose** candidates when they build the graph
(sinks, and items that unblock three or more rows) with the reason; a human
accepts or amends them in assisted mode, an autonomous run accepts its own
proposal and records it. The cell itself stays authored either way — readiness is
computed and never stored here, but a judgement about where a full run earns its
time is not computable from the graph.

### `wave`, the authored ordering view over the graph

The graph answers "what blocks X". It does not answer "which six items are this
fortnight's front", and it has no place for a human to say so. `wave` is that
place. It is an **ordering key that a human writes**, and it changes nothing the
framework computes:

- **Readiness is unchanged and stays the only gate.** An item is ready when every
  `depends_on` is Done, whatever the waves say (`work_items.md` Section 7).
  `/deliver` dispatches the lowest wave first **among ready items** and never
  withholds a ready item because a lower wave is still in flight — a hard stop is
  expressed with `depends_on`, which is what the graph is for.
- **No status ever enters this file.** A wave is never marked complete here,
  nothing writes a `✅` beside it, and the grouped overview is rendered on demand
  from this table plus live status (`bash .claude/scripts/feature-map-waves.sh`,
  or the `/waves` command). That is the first of the two properties that retired
  the old wave model, and it stays retired.
- **The wave is authored and editable throughout development**, not computed once
  at init. That is the second retired property. `/sync-project` and `/deliver`
  **propose** waves for rows that have none — the longest-path level in the graph:
  1 for a row with no dependencies, otherwise one more than the largest wave among
  its dependencies — and a generator **never rewrites a cell that already carries a
  wave**. Re-plan by editing the cells; clear a cell to be proposed a fresh value
  on the next `/sync-project`.

**The invariant, and it is enforced rather than advised:** for every waved row,
**every** `depends_on` is waved and carries a **strictly smaller** wave. That is
the hard dependency stop — a human may pull an item earlier only as far as its
dependencies allow, and the validator says no, naming the edge, rather than the
model deciding case by case. A non-integer or non-positive cell is an error too.
A map with no waves at all is valid: the column is optional, and an all-unwaved
map is exactly what a project that has not sequenced anything yet should have.

**`local` and `hybrid` items carry `wave: N` in their `docs/issues/{ID}.md`
frontmatter instead**, beside `depends_on` and `scaffold: true`, hand-authored and
never proposed. Nothing validates that frontmatter, so the invariant is reported
there as a **warning** naming the edge — by the overview at render, and by the
batch `wave N` selector at admission — never as a validation error.

## Work items

| Feature ID | Title | depends_on | branch | scaffold | shared_risk_notes | test_checkpoint | wave |
| --- | --- | --- | --- | --- | --- | --- | --- |
| US-101 | User login | [] | feature/US-101-user-login | ✅ | | | 1 |
| US-102 | Dashboard layout | [] | feature/US-102-dashboard | | | | 1 |
| US-103 | User management | [US-101] | feature/US-103-user-mgmt | | ⚠️ shares routes.ts with US-104 | | 2 |
| US-104 | Team settings | [US-101] | feature/US-104-team-settings | | ⚠️ shares routes.ts with US-103 | ✅ | 2 |

> The four rows above are **illustrative**. `/sync-project` and `/deliver` replace
> them with the project's real items. If they are still present after init, the
> generation step did not run.
