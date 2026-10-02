<!-- materialized-from: mayker-dev v0.3.250; do not edit, regenerate with /upgrade-project -->
# Work items

> **Not loaded at launch:** Sections 2 to 4 and 6 in `${CLAUDE_PLUGIN_ROOT}/rules/work_items/local_items_and_status.md`; Sections 7 to 9 in `${CLAUDE_PLUGIN_ROOT}/rules/work_items/readiness_resume_commit.md` (the mayker-dev plugin). Read the named file before you apply or cite one of those sections.

> **Rules here, reasons there:** the full text of Section 1's tracker-ID paragraph is in `${CLAUDE_PLUGIN_ROOT}/rules/work_items/local_items_and_status.md` → "Section 1, in full".

## 1. Sources

A *work item* is a unit of work: a feature, bug, performance issue, or chore. Its source is set by `CLAUDE.md` Work Item Source:

- `tracker`: items live in the issue tracker (the configured provider) via MCP. This is the default and matches the original framework behaviour.
- `local`: items live as files under `docs/issues/` in the repo. No tracker MCP is required.
- `hybrid`: resolve from the tracker if the ID exists there, otherwise from `docs/issues/`.

**A tracker item with no human-readable key gets a framework-assigned ID** (`FEAT-{n}`, or `BUG-`/`PERF-`/`CHORE-` by its type), which `/sync-project` Section 2 writes back onto the item. The rules for assigning it are `mcp_integration.md` Section 1.5's alone.

## 5. MCP requirement by source

- `tracker` or `hybrid`: the issue tracker MCP is required, per `mcp_integration.md`.
- `local`: the issue tracker MCP is NOT required. PR and review-comment operations still run through the Git provider working path, which Work Item Source does not affect (working path resolved and recorded per `mcp_integration.md` Section 5.0); if neither is present, PR-based steps fall back to a manual note in the work-item file.
