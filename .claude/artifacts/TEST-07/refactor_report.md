# Refactor report: TEST-07

Result: 1 improvements applied (7 files examined)

Files examined (source and tests this feature created or modified): backend/app/main.py, backend/app/routers/uptime.py, backend/app/schemas/uptime.py, backend/app/services/uptime_service.py, backend/tests/integration/test_uptime_integration.py, backend/tests/unit/test_main_unit.py, backend/tests/unit/test_uptime_service_unit.py.

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/app/schemas/uptime.py | Phase E finding 1: the `-> str` return annotation on the field serializer made the OpenAPI schema of `started_at` a bare string with no `format: date-time` (plan.md line 154 expects date-time) | Phase E RECOMMENDED review finding | RECOMMENDED | Drop the return annotation (with a comment saying why); pin with `test_get_uptime_openapi_started_at_property_has_date_time_format` in the existing integration test file |

## Phase E finding 1, discharged

Verify command, before the change:

`{"type": "string", "title": "Started At"}`

The prediction was correct: no `format`. After the change:

`{"type": "string", "format": "date-time", "title": "Started At"}`

The serialised value is unchanged: the serializer body is untouched and still emits the `+00:00` offset, which `test_get_uptime_started_at_is_utc_with_explicit_offset` keeps asserting.

## Checklist pass (refactoring categories 1 to 7)

No further findings: naming follows the project conventions, no duplicate logic, no dead code (the unused `import os` Phase B removed from main.py is gone, and lint passes), no function near the complexity limit, layering is router to service with no logic in the router, no circular or wildcard imports, one concern per file.

## Tests after the change

- unit: 42 passed, 0 failed, 0 skipped
- integration: 12 passed, 0 failed, 14 skipped. The 14 skips are the pre-existing database-backed tests: this run recorded no `- env:` line, so no database was exported. The uptime tests need no database and all passed.
- lint (`uv run ruff check`): all checks passed

No file was created other than this report.
