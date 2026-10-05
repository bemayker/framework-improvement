<!-- materialized-from: mayker-dev v0.3.273; do not edit, regenerate with /upgrade-project -->
<!--
  Universal standard. Loaded at launch from .claude/rules/ (always on). Do not edit per project.
  Autonomous decision authority, decision log, merge policy, escalation bar,
  remote git through the provider's working path, repository creation policy.
  Inert unless CLAUDE.md Autonomy is `autonomous`.
-->

# Autonomy standard

> **Not loaded at launch:** Sections 2 to 8 in `${CLAUDE_PLUGIN_ROOT}/rules/autonomy/autonomous_run.md` (the mayker-dev plugin). Read the named file before you apply or cite one of those sections.

## 1. When this applies

This rule governs behaviour when `CLAUDE.md` → Autonomy is set to `autonomous`: the `/deliver` run drives the whole backlog with no human action after setup. When Autonomy is `assisted` (the default) this rule is inert and the original human-gated lifecycle applies: humans review plan PRs, move items to Ready for Build, review implementation PRs, and merge.

The only human inputs to an autonomous project are one-time setup: the filled-in `CLAUDE.md` (tech stack, MCP configuration, test configuration, toggles) and the architecture notes or documents. After that, the framework decides and acts on its own.
