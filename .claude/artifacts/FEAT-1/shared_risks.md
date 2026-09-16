# Shared Risk Analysis, FEAT-1

Derived from the feature text and `.claude/feature_map.md`, not from the plan's File Manifest: this file answers which files two *items* might collide on, which is a whole-feature question rather than a per-phase one.

FEAT-1's map row: `depends_on [TEST-01]` (Done), branch `feature/FEAT-1-server-time-endpoint`, wave 2, `shared_risk_notes: ⚠️ FEAT-1, TEST-06 and TEST-07 all register a router in backend/app/main.py; serialize if run concurrently. Disjoint from TEST-08 (frontend only)`.

**One of the three named items has since merged.** TEST-06 (Echo endpoint) is Done, landed on `main` as `caa57a5` (PR #51), so it is no longer a concurrency risk — what it leaves behind is a resolved base, not a conflict. TEST-07 is still `todo` with no branch on the remote, and is the live half of that map note. The cell itself is left as it stands: it is a human-authored column and this file is the current reading of it.

## Files this feature will create
- backend/app/routers/time.py
- backend/app/schemas/time.py
- backend/tests/unit/test_time_router_unit.py
- backend/tests/integration/test_time_integration.py
- e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature
- e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md
- .claude/artifacts/FEAT-1/uat_script.md

None of these paths is claimed by another open item: every one carries either this feature's own `time` module name or its `FEAT-1` prefix, so no other item can create the same path. `test_time_router_unit.py` in particular cannot collide with TEST-07's unit file, which will carry its own module name.

## Existing files this feature will modify
- backend/app/main.py: one added router import (`time`, sorted between `notes` and `version`) and one added `app.include_router(time_router)` line at the end of `create_app()`'s registration block, after `echo_router`. One clause is appended to the module docstring's per-feature sentence. No existing line is moved, renamed or reordered, and neither the CORS middleware nor the `lifespan` handler is touched.
- backend/tests/unit/test_main_unit.py: one added test function asserting `/api/time` is a registered route, appended after the existing echo case. No existing test is modified; the shared helper `_collect_route_paths` and the `BUILT_IN_ROUTE_PATHS` constant are reused as they stand.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by **TEST-07** (Uptime endpoint, `GET /api/uptime`, wave 2, currently `todo` with no branch on the remote) — independent of FEAT-1, could run concurrently, and its whole scope is registering another `/api` router in the same `create_app()` block. The two branches would add adjacent lines in the same sorted import block and adjacent lines at the end of the same registration block, which is a textbook merge conflict rather than a hypothetical one. **Serialize: do not build FEAT-1 and TEST-07 at the same time.**
- backend/tests/unit/test_main_unit.py may also be modified by **TEST-07** — it will add its own route-registration case to the same file, appended at the same place as this feature's. Lower stakes than the factory itself (an append-only conflict, trivially resolvable), but it is the second file the two items share and it is listed so a resolver is not surprised by it.
- **TEST-06** (Echo endpoint) was the third item on this row's shared-risk note and is **no longer a concurrency risk**: it merged to `main` as `caa57a5` before this plan was written. Its lines in `backend/app/main.py` and `backend/tests/unit/test_main_unit.py` are now part of the base rather than a competing branch, and this plan's insertion points are derived against them. What remains is an ordinary integration step, not a serialization decision: FEAT-1's branch base (`ea8a2f2`) predates that merge, so `origin/main` must be merged or rebased into this branch before or during the build — otherwise the two files would be edited against content that no longer matches main and the PR would carry a conflict.
- **TEST-08** (Footer shows the app version, currently `todo`) is frontend-only and shares no path with this feature: it touches `frontend/src/` and this feature touches `backend/app/` and `backend/tests/`. It may run concurrently with FEAT-1 with no serialization.
- No other open item touches `backend/app/routers/`, `backend/app/schemas/` or the `e2e/uat/` artifacts this feature creates, so the created-file list carries no conflict at all.
