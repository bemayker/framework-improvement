# mayker-dev-template

A per-project **starting point** for the `mayker-dev` AI delivery framework. Create a repo from this template, open it in Claude Code, and run `/init-project`: the framework generates your project config and documentation from the plugin.

> This repo is intentionally thin. It holds **only** the bootstrap and a couple of placeholders. The commands, skills, subagents, hooks, engineering standards, **and the canonical `README.md` / `docs/DEVELOPMENT.md` templates** all live in the `mayker-dev` plugin (single source of truth). `/init-project` *materializes* them into your project, so nothing is copied by hand and nothing can drift from the framework.

## What's in here before you run anything

```text
.
├── .claude/
│   ├── settings.json     # Bootstrap only: extraKnownMarketplaces + enabledPlugins (triggers the plugin install prompt)
│   ├── rules/            # Empty except a README pointer; /init-project materializes the always-on standards here
│   ├── feature_map.md    # Stub; generated for real by /init-project
│   └── artifacts/        # Empty; agents write per-feature plans/reports here
├── .mcp.json.example     # Sample MCP server config (ClickUp + GitHub shape); `claude mcp add` writes the real .mcp.json
├── docs/
│   └── DEVELOPMENT.md     # Placeholder; /init-project materializes the full guide from the plugin
└── README.md             # This file; /init-project replaces it with your project's README (also from the plugin)
```

There is no `CLAUDE.md` until `/init-project` generates it.

## Get started

1. **Install the plugin** (you are prompted automatically on first open because of the committed `.claude/settings.json`; or do it by hand):

   ```bash
   claude plugin marketplace add bemayker/mayker-marketplace
   claude plugin install mayker-dev@mayker
   ```

2. **Connect the two MCPs** with `claude mcp add --scope project ...` — an issue tracker and a Git provider. GitHub uses a **PAT in a header** (not OAuth); ClickUp/Linear/Jira use **OAuth**. Skip the tracker for `local` work-item source. (The full forms and the auth gotchas are in the guide `/init-project` generates.)

3. **Run `/init-project`** in a local Claude Code session. It generates `CLAUDE.md`; fill in your project details and re-run it to finish. It then materializes `README.md`, `docs/DEVELOPMENT.md`, the `.claude/rules/` standards, `.claude/settings.json` permissions, `project_state.json`, `feature_map.md`, and the CI pipelines — all from the plugin.

4. **Commit and push** everything, add the CI secret(s), then build the **scaffold feature** first.

**Autonomous alternative.** Instead of steps 3 and 4's per-feature loop: fill in the generated `CLAUDE.md` (tech stack, MCP configuration, architecture notes), set `Autonomy: autonomous` in its `## Autonomy` section, commit and push, then dispatch `/deliver` once. It initializes the project non-interactively, ingests the whole backlog, and drives every item to Done itself (self-approved plans, CI monitored and fixed, merges decided by the framework), logging its decisions in `DECISIONS.md`. The GitHub MCP is required in this mode. See the plugin walkthrough, part 3.

After `/init-project` runs, this README and `docs/DEVELOPMENT.md` become your project's real docs. Until then, the canonical reference is the plugin's [walkthrough](https://github.com/bemayker/mayker-dev-plugin/blob/main/docs/WALKTHROUGH.md) and [`README`](https://github.com/bemayker/mayker-dev-plugin).

## The framework

```text
  mayker-marketplace        catalog: lists the plugin and pins or floats its version
        |  (installs)
        v
  mayker-dev-plugin         the brain: commands, skills, subagents, hooks, standards, doc templates
        |  (drives / materializes)
        v
  mayker-dev-template       this repo: a per-project starting point (config + generated state only)
```

- **Project mode:** `greenfield` (scaffold a new app) or `existing` (adapt to an established codebase). For an existing codebase you do **not** start from this template — install the plugin in your repo and run `/init-project existing`.
- **Work item source:** `tracker` (ClickUp/Linear/Jira via MCP), `local` (issue files in `docs/issues/`, no tracker needed), or `hybrid`.
- **Autonomy:** `assisted` (human review gates, the default) or `autonomous` (`/deliver` runs the whole backlog with no human gates; quality gates unchanged).
