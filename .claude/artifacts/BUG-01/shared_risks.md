# Shared Risk Analysis, BUG-01

## Files this feature will create
- e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature
- e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md
- .claude/artifacts/BUG-01/uat_script.md

## Existing files this feature will modify
- backend/app/routers/server_time.py: inject `Response` into `get_server_time` and set `Cache-Control: no-store`
- backend/tests/integration/test_server_time_integration.py: add the header assertion test
- backend/tests/unit/test_server_time_unit.py: add the handler header test and pass a `Response` in the existing clock test

## Potential conflicts with other independent features
- None expected with the items in flight. TEST-09 (version endpoint) edits backend/app/main.py and its own version router, schema, service and tests; BUG-01 does not touch main.py or any version file. BUG-04 (note form double submit) is frontend, or notes router and service if fixed server-side; BUG-01 touches neither. feature_map.md already records BUG-01 as disjoint from TEST-08, TEST-09 and BUG-04.
- Dependency, not conflict: BUG-01 depends on FEAT-1 (server time endpoint, complete), whose files it modifies. CHORE-06 (BUG-01 follow-up) depends on BUG-01 and may later edit the same server-time files, so it must not run before this item merges.
