# Shared Risk Analysis, TEST-07

## Files this feature will create
- backend/app/schemas/uptime.py
- backend/app/routers/uptime.py
- backend/tests/unit/test_uptime_unit.py
- backend/tests/integration/test_uptime_integration.py
- e2e/uat/scenarios/TEST-07_uptime_endpoint.feature
- e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md
- .claude/artifacts/TEST-07/uat_script.md

## Existing files this feature will modify
- backend/app/main.py: imports the uptime router and adds one `include_router` call in `create_app()`, appended last in the registration block; extends the module docstring's per-feature router clause
- backend/tests/unit/test_main_unit.py: adds a route-registration assertion for `/api/uptime` after the last existing registration test

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by FEAT-1 (independent, could run concurrently): per `feature_map.md`, FEAT-1, TEST-06 and TEST-07 all register a router in `backend/app/main.py`; serialize rather than run concurrently. This risk is live in this run: FEAT-1 ("Server time endpoint") is being built in the same `/deliver` run and its plan adds `from app.routers.server_time import router as server_time_router` plus `app.include_router(server_time_router)` to the same import group and the same registration block TEST-07 edits. The scheduler serializes TEST-07 behind FEAT-1, and TEST-07's plan states its insertion points against the post-FEAT-1 state (uptime import between `server_time` and `version`; `include_router(uptime_router)` after `include_router(server_time_router)`), with a fallback rule if FEAT-1's lines are absent. One further fact worth the scheduler's attention: FEAT-1's remote branch (`084c89e`, plan commits only) was cut from `2f8fb91`, before TEST-06's merge `73e544c`, so FEAT-1's own merge has to reconcile `main.py` against the echo lines before TEST-07 ever touches the file; TEST-07 must not start until that merge has landed on `origin/main`.
- backend/tests/unit/test_main_unit.py may also be modified by FEAT-1 (independent, could run concurrently): both add a `test_create_app_registers_{route}_route` function at the same insertion point, after the last registration test and before `test_create_app_returns_independent_instances`. Not named in `feature_map.md`'s note, which names only `main.py`; flagged here because the TEST-02, TEST-05 and TEST-06 precedent makes this file a certain touch for any item that registers a router.
- backend/app/main.py and backend/tests/unit/test_main_unit.py were also named as shared with TEST-06 (independent): that overlap is retired for this run, because TEST-06 merged on `73e544c` and its echo lines are already on `origin/main`; TEST-07 builds on top of them and does not touch them.
- TEST-08 is disjoint from TEST-07 (frontend only, per `feature_map.md`): no shared files, no serialization needed.
- No other item touches `backend/app/schemas/`, `backend/app/routers/uptime.py`, the two new test modules or the TEST-07 UAT files: those paths are unique to this item.
