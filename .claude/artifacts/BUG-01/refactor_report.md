# Refactor report: BUG-01

Gate outcome: 1 improvements applied (11 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md and .claude/artifacts/BUG-01/uat_script.md (line 20) | Deployed check used `curl -sI` (HEAD); the route answers GET only, HEAD returns 405 without Cache-Control | Review RECOMMENDED finding 1 (mandatory input) | RECOMMENDED | Changed to `curl -si`, matching plan.md line 145. Applied |

Verify by running: started the worktree app on port 8011; `curl -si` (GET) returned 200 with `cache-control: no-store`; `curl -sI` (HEAD) returned `405 Method Not Allowed` with `allow: GET` and no Cache-Control. The suspicion was confirmed, so the finding was applied.

Checklist pass over the backend files (router, service, schema, main.py, tests): no naming, DRY, dead-code, complexity, layering or import findings.
