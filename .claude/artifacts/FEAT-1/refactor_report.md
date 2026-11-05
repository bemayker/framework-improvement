# Refactor report: FEAT-1

Result: 1 improvements applied (6 files examined)

Files examined: backend/app/main.py, backend/app/routers/server_time.py, backend/app/schemas/server_time.py, backend/tests/integration/test_server_time_integration.py, backend/tests/unit/test_main_unit.py, backend/tests/unit/test_server_time_unit.py (the two `.claude/artifacts/` files are lifecycle records, not code).

## Phase E finding: OpenAPI output schema for `now`

Ran: `uv run --directory backend python -c "import json; from app.main import create_app; print(json.dumps(create_app().openapi()['components']['schemas']))"`

Result: `ServerTimeResponse.now` was `{"type": "string", "title": "Now"}`, with no `format: date-time`. The prediction was right.

Fix (smallest, behaviour-preserving): `now` now carries `Field(json_schema_extra={"format": "date-time"})` in backend/app/schemas/server_time.py. After the fix the schema reads `{"type": "string", "format": "date-time", "title": "Now"}`. Runtime serialisation is unchanged (same `+00:00` string). A regression test, `test_server_time_response_output_schema_declares_date_time_format`, was added to the existing unit test file; no file was created.

## Checklist findings

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/app/schemas/server_time.py | Output schema lost `format: date-time` (Phase E) | Review finding | RECOMMENDED | Applied: `json_schema_extra` pin plus regression test |

No findings in naming, DRY, dead code, complexity, layering, import hygiene or file structure.

## Tests after the change

- unit: 45 passed
- integration: 9 passed, 14 skipped (pre-existing DB tests, DATABASE_URL unset)
