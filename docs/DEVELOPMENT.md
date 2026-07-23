# Development workflow

> **This file is a placeholder.** The full development guide is **materialized from the `mayker-dev` plugin's canonical template** (`templates/project-docs/DEVELOPMENT.md`) when you run `/init-project`, filled in for your project and Project Mode. Until then, this stub stands in so the README link resolves. The plugin is the single source of truth, so the guide can never drift from the framework it documents.

When generated, the guide covers, in full:

- **MCP setup** — the exact `claude mcp add` forms, the GitHub **PAT-in-header** and ClickUp **OAuth** specifics, the optional Figma MCP, and keeping token secrets out of git.
- **Permissions & autonomy** — the `.claude/settings.json` allow/deny posture and the plugin's hooks.
- **Repository secrets for CI/CD** — the tracker API key (e.g. `CLICKUP_API_KEY`) and where to add it, the **opt-in Slack** setup (`NOTIFY_SLACK` Variable + `SLACK_WEBHOOK_URL` Secret + local push), and the optional `AIKIDO_API_KEY` for security scanning.
- **The command, subagent, and hook reference**, the status flow, testing, security scanning, and **CI/CD** (PR tests, auto-Done on merge, Slack notifications).
- **Autonomous mode** — the `Autonomy` toggle and `/deliver`: whole-backlog delivery on the dependency graph with self-approved plans, CI monitoring and fixing, AI-decided merges, the decision log, and the GitHub-MCP-only git path.
- **Troubleshooting** and **edge cases** (auto-Done recovery, hotfixes/rollbacks, conflicts between concurrent features).

## Generate it

1. Install the plugin:

   ```bash
   claude plugin marketplace add bemayker/mayker-marketplace
   claude plugin install mayker-dev@mayker
   ```

2. Connect the MCPs with `claude mcp add --scope project ...` (skip the tracker for `local` work-item source).
3. Run `/init-project` (new project) or `/init-project existing` (established codebase) in a local Claude Code session. Fill in the generated `CLAUDE.md` and re-run to finish.

For the canonical content before you generate it, read the plugin's [walkthrough](https://github.com/bemayker/mayker-dev-plugin/blob/main/docs/WALKTHROUGH.md) and the template at [`mayker-dev-plugin/templates/project-docs/DEVELOPMENT.md`](https://github.com/bemayker/mayker-dev-plugin/blob/main/templates/project-docs/DEVELOPMENT.md).
