# Shared Risk Analysis, FEAT-1

Derived from the feature text and `.claude/feature_map.md`, not from the plan's File Manifest: this file answers which files two *items* might collide on, which is a whole-feature question rather than a per-phase one.

FEAT-1's map row: `depends_on [TEST-01]` (Done), branch `feature/FEAT-1-server-time-endpoint`, wave 2, `shared_risk_notes: ⚠️ FEAT-1, TEST-06 and TEST-07 all register a router in backend/app/main.py; serialize if run concurrently. Disjoint from TEST-08 (frontend only)`.

## Files this feature will create
- backend/app/routers/time.py
- backend/app/schemas/time.py
- backend/tests/unit/test_time_unit.py
- backend/tests/integration/test_time_integration.py
- e2e/uat/scenarios/FEAT-1_server_time_endpoint.feature
- e2e/uat/scripts/FEAT-1_server_time_endpoint_uat_script.md
- .claude/artifacts/FEAT-1/uat_script.md

None of these paths is claimed by another open item: every one carries either this feature's own `time` module name or its `FEAT-1` prefix, so no other item can create the same path.

## Existing files this feature will modify
- backend/app/main.py: one added router import and one added `app.include_router(time_router)` line inside `create_app()`. No existing line is moved, renamed or reordered, and neither the CORS middleware nor the `lifespan` handler is touched.
- backend/tests/unit/test_main_unit.py: one added test function asserting `/api/time` is a registered route. No existing test is modified; the shared helper `_collect_route_paths` and the `BUILT_IN_ROUTE_PATHS` constant are reused as they stand.

## Potential conflicts with other independent features
- backend/app/main.py may also be modified by **TEST-06** (Echo endpoint, branch `feature/TEST-06-echo-endpoint`, wave 2, open and ready) — independent of FEAT-1, could run concurrently, and its whole scope is registering another `/api` router in the same `create_app()` block. The two branches would add adjacent lines in the same import block and the same registration block, which is a textbook merge conflict rather than a hypothetical one. **Serialize: do not build FEAT-1 and TEST-06 at the same time.** A tracker comment on FEAT-1 asked for TEST-06's `GET /api/echo` to be folded into this item so the registrations land together; that is refused on scope containment (`## Re-Plan Feedback` point 2 in `plan.md`), and this serialization is the answer to the same concern.
- backend/app/main.py may also be modified by **TEST-07** (Uptime endpoint, wave 2, open and ready) — independent of FEAT-1, could run concurrently, same `create_app()` import and registration block, same conflict shape. **Serialize.**
- backend/tests/unit/test_main_unit.py may also be modified by **TEST-06** and **TEST-07** — each will add its own route-registration case to the same file, appended at the same place as this feature's. Lower stakes than the factory itself (an append-only conflict, trivially resolvable), but it is the second file the same three items share and it is listed so a resolver is not surprised by it.
- **TEST-08** (Footer shows the app version) is frontend-only and shares no path with this feature: it touches `frontend/src/` and this feature touches `backend/app/` and `backend/tests/`. It may run concurrently with FEAT-1 with no serialization.
- No other open item touches `backend/app/routers/`, `backend/app/schemas/` or the `e2e/uat/` artifacts this feature creates, so the created-file list carries no conflict at all.
