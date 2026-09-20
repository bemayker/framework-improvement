# Shared Risk Analysis, TEST-07

## Files this feature will create
- backend/app/schemas/uptime.py
- backend/app/services/uptime_service.py
- backend/app/routers/uptime.py
- backend/tests/unit/test_uptime_service_unit.py
- backend/tests/unit/test_uptime_unit.py
- backend/tests/integration/test_uptime_integration.py
- e2e/uat/scenarios/TEST-07_uptime_endpoint.feature
- e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md
- .claude/artifacts/TEST-07/uat_script.md

None of these paths exists on `origin/main` at 374e468: the uptime code delivered by the reverted PRs #26 and #39 was removed by #29 and #44, so every entry above is a genuine create rather than an overwrite.

## Existing files this feature will modify
- backend/app/main.py: one import pair (the uptime router and the uptime service), one `app.include_router(uptime_router)` line appended to the existing registration block in `create_app()`, one `uptime_service.record_start()` call inside the existing `lifespan` hook before the database branch, and one clause added to the module docstring's per-feature sentence. No restructuring of the factory.
- backend/tests/unit/test_main_unit.py: one new test function, `test_create_app_registers_uptime_route`, appended beside the existing per-router registration assertions.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by FEAT-1 (Server time endpoint; independent of TEST-07, both depend only on TEST-01, so the two could run concurrently). FEAT-1 registers its own router in `create_app()` and is currently at `plan_review` with an open draft plan PR (#56). Both items append a line to the same registration block and touch the same module docstring sentence, so a concurrent build produces a textual conflict on merge. **Serialize the two builds** — build one, merge it, then build the other against the merged main. `feature_map.md` already carries the warning on both rows.
- backend/tests/unit/test_main_unit.py may also be modified by FEAT-1, for the same reason and in the same place: each item appends one `test_create_app_registers_{x}_route` function to the end of that file. The same serialization covers it; no separate mitigation is needed.
- backend/app/main.py and backend/tests/unit/test_main_unit.py are also flagged against TEST-06 (Echo endpoint) in `feature_map.md`. That item is **merged** (`feat(TEST-06): Echo endpoint (#55)` on main), so the overlap is historical rather than live: its `app.include_router(echo_router)` line and its registration test are already on main and are the insertion points this feature appends after. No serialization is required against TEST-06.
- TEST-08 (Footer shows the app version) is frontend-only and touches no path listed above. It is disjoint from this feature and the two may run concurrently.
