# Project Configuration

## Project mode
- **Mode:** greenfield            # greenfield | existing

## Work item source
- **Source:** hybrid               # tracker | local | hybrid

## Autonomy

<!--
  Selects the operating model (see .claude/rules/autonomy.md).
    assisted:   the original lifecycle. Humans review plan PRs, move items to
                Ready for Build, review implementation PRs, and merge.
    autonomous: /deliver drives the entire backlog to Done with no human
                gates: self-approved plans, AI-decided merges, CI monitoring
                and fixing, parallel items on the dependency graph. Quality
                gates (tests, branch guard, self-review, refactor gate) are
                identical in both modes.
  The settings below apply only when Autonomy is `autonomous`.
-->

- **Autonomy:** assisted          # assisted | autonomous
- **Max parallel items:** 3       # concurrency cap for the /deliver scheduler
- **Merge method:** squash        # squash | merge | rebase (used by merge_pull_request)
- **CI fix attempts:** 3          # diagnose-fix-push cycles per PR before marking the item blocked
- **Repository creation:** allowed  # allowed | primary-only (new repos for separately-deployable services)
- **Default organization:** bemayker  # GitHub org for repositories created by a run

<!--
  This is the ONLY file you customize per project. `/init-project` generates
  this file from the mayker-dev plugin if it is missing, then you fill in the
  sections below and re-run `/init-project`. Everything in .claude/rules/ is
  universal and should not be edited.

  CLAUDE.md is Claude Code's persistent project memory: it is loaded into
  every session (interactive, Claude Code on the web, and Routines). Keep it
  lean: anything long or conditional lives in .claude/rules/ and is either
  @-imported below or loaded on demand by the skill that needs it.
-->

## Project Description

Minimal task-notes app used exclusively as a validation sandbox for the mayker-dev framework. Features are deliberately trivial; the point is exercising the framework lifecycle, not the product.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** FastAPI, Python 3.12, managed with uv
- **Database:** PostgreSQL via Docker
- **Testing:** pytest via uv (unit/integration), Vitest (frontend), Playwright TypeScript (E2E)
- **Containerization:** Docker Compose

## MCP Configuration

<!--
  Work Item Source is `hybrid`: TEST-02 resolves from its ClickUp twin (list
  "Validation sandbox"), TEST-01/TEST-03 stay local in docs/issues/. The Git
  provider MCP stays recommended for PRs but degrades to the `gh` CLI, which
  this project uses.
-->

- **Issue Tracker:** clickup
- **Workspace ID:** 30307190
- **Project/List:** Validation sandbox (list id 901524718831)
- **Git Provider:** github
- **Repository:** bemayker/framework-improvement

## Design Reference

<!--
  How the AI accesses visual design specifications.
  Modes:
    REPO_DIR:  Figma-to-code export committed in the repo (best for cloud agents)
    FIGMA_MCP: Access Figma directly via MCP (requires Figma MCP connection)
    URL:       Public Figma/prototype URL (less reliable, access issues possible)
    NONE:      No design reference; AI freestyles the UI
-->

- **Mode:** NONE

## Test Configuration

<!--
  Directory paths and naming conventions for each test tier.
  Agents use these paths when generating and locating test files.
-->

- **Test gate command:** cd backend && uv run pytest -q && cd ../frontend && npm test

### Unit & Integration Tests

- **Unit test directory:** backend/tests/unit/
- **Integration test directory:** backend/tests/integration/
- **Unit test naming:** test_{module}_unit.py
- **Integration test naming:** test_{module}_integration.py
- **Shared fixtures file:** backend/tests/conftest.py

### E2E Tests

- **Framework:** Playwright (TypeScript)
- **Config file:** playwright.config.ts (project root)
- **Test directory:** e2e/tests/
- **Helpers directory:** e2e/helpers/
- **File naming:** {feature_id}_{slug}.spec.ts
- **Base URL:** http://localhost:5173

### UAT Tests

- **Scenarios directory:** e2e/uat/scenarios/
- **Scripts directory:** e2e/uat/scripts/
- **Screenshots directory:** e2e/uat/screenshots/ (gitignored)
- **Reports directory:** e2e/uat/reports/ (gitignored)
- **Gherkin file naming:** {feature_id}_{slug}.feature
- **Manual script naming:** {feature_id}_{slug}_uat_script.md

## Feature Toggles

<!--
  Control which phases run during /build-feature, and which CI tiers
  /init-project generates.
  ENABLED = runs and gates (blocks PR if failing)
  OPTIONAL = runs but failures don't block
  DISABLED = phase is skipped entirely

  Security Scanning (Aikido) maps the same way: ENABLED = the CI gate blocks on
  new findings at or above the threshold; OPTIONAL = the scan runs but does not
  block; DISABLED = no scan workflow is generated. With ENABLED or OPTIONAL,
  /init-project materializes security-scan.yml (greenfield) or offers it
  (existing); the gate stays inert until the AIKIDO_API_KEY secret is added. The
  optional aikido-autofix.yml workflow (opt-in via the AIKIDO_AUTOFIX repo
  Variable) then dispatches an agent to fix what Aikido flags on a PR. See
  ${CLAUDE_PLUGIN_ROOT}/rules/security_standards.md.
-->

- **E2E Tests:** ENABLED
- **UAT Generation:** ENABLED
- **Refactor Gate:** ENABLED
- **Integration Tests:** ENABLED
- **Security Scanning:** DISABLED

## Architecture Notes

Keep every feature as small as possible.

---

## Universal Standards (always on)

<!--
  These standards apply to every session and are imported inline. They are the
  always-relevant ones. The phase-specific standards (testing, refactoring,
  review, security) are NOT imported here to keep this file lean: each skill and subagent
  reads them on demand straight from the plugin (`${CLAUDE_PLUGIN_ROOT}/rules/`),
  so they are not materialized into this repo.

  The files under `.claude/rules/` are materialized by /init-project from the
  mayker-dev plugin (the single source of truth) and are overwritten on every
  run. Do not edit them here; edit them in the plugin and re-run /init-project.
-->

@.claude/rules/coding_standards.md
@.claude/rules/user_story_alignment.md
@.claude/rules/workflow_triggers.md
@.claude/rules/mcp_integration.md
@.claude/rules/existing_codebase.md
@.claude/rules/work_items.md
@.claude/rules/autonomy.md

Phase-specific standards (read on demand straight from the mayker-dev plugin, not materialized into this repo):

- `${CLAUDE_PLUGIN_ROOT}/rules/testing_standards.md`: loaded by the build-feature and generate-tests skills and the builder subagent.
- `${CLAUDE_PLUGIN_ROOT}/rules/refactoring_standards.md`: loaded by the refactor skill and the build-feature refactor gate.
- `${CLAUDE_PLUGIN_ROOT}/rules/review_standards.md`: loaded by the build-feature self-review step and the reviewer subagent.
- `${CLAUDE_PLUGIN_ROOT}/rules/security_standards.md`: loaded by the security-scan skill, the build-feature self-review step, and the reviewer subagent (when Security Scanning is enabled).
