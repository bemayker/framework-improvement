# Refactor Gate Report — TEST-07

## Phase E RECOMMENDED findings (mandatory input)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/app/services/uptime_service.py | `record_start()` wrote `_started_at` before `_monotonic_start` (lines 48-49), while both guards in the module key on `_started_at` alone, making "`_started_at` set, `_monotonic_start` None" a real intermediate state a re-entered `record_start()` could observe and leave unrepaired. The `get_uptime()` comment calling the fallback branch "Unreachable" was also false. | Excessive complexity / correctness | RECOMMENDED | Applied: swapped the assignment order so `_monotonic_start` is captured and assigned first and `_started_at` (the guard field) is written last, closing the window. Corrected the comment to describe the branch as a type-narrowing guard rather than unreachable code. |
| 2 | backend/tests/unit/test_uptime_unit.py | The `format: date-time` assertion was pinned against `UptimeResponse.model_json_schema(mode="serialization")`, one step removed from the generated OpenAPI document (`app.openapi()`) that the plan's Re-Plan Feedback, the tracker comment, and the manual UAT script are actually about. | Test coverage | RECOMMENDED | Verified first: `create_app().openapi()["components"]["schemas"]["UptimeResponse"]["properties"]["started_at"]` returns `{"type": "string", "format": "date-time", "title": "Started At"}` — the served document already carries the annotation, so this is a coverage gap, not a broken document. Added `test_openapi_document_declares_started_at_format_date_time`, asserting directly against `create_app().openapi()`, alongside the existing model-schema test (kept, since it pins a different and still-true fact). |

## Own-analysis findings (Section 3 checklist, all files created or modified by this feature)

Reviewed: `backend/app/schemas/uptime.py`, `backend/app/services/uptime_service.py`, `backend/app/routers/uptime.py`, `backend/app/main.py`, `backend/tests/unit/test_uptime_service_unit.py`, `backend/tests/unit/test_uptime_unit.py`, `backend/tests/integration/test_uptime_integration.py`, `backend/tests/unit/test_main_unit.py`.

None. Naming, layering (router holds no business logic, service holds none of the router's mapping), dead code, import hygiene, and file structure all match the conventions the sibling `version`/`health`/`echo` slices already established in this codebase, and no new complexity, duplication, or architecture drift was found beyond the two findings above.

## Files created by this pass

None. Both findings above were applied as modifications to existing files; no new file was needed for either.

## Verification

- Verify command from RECOMMENDED 2 (run before applying the fix): `uv run --directory backend python -c "import json; from app.main import create_app; print(json.dumps(create_app().openapi()['components']['schemas']['UptimeResponse']['properties']['started_at']))"` → `{"type": "string", "format": "date-time", "title": "Started At"}`.
- Unit tests: `uv run --directory backend pytest tests/unit -q` → 46 passed, 0 failed (45 pre-existing + 1 new).
- Integration tests: `uv run --directory backend pytest tests/integration -q` (against a freshly provisioned PostgreSQL 16 container) → 28 passed, 0 failed. No regressions; nothing reverted.

## Scope rules (`refactoring_standards.md` Section 5)

No new features, no API signature changes, no database migrations, all tests pass, both changes stayed within the `uptime` module/test boundary. No cross-module boundary was touched.
