# Refactor report: TEST-07

Result: 1 improvements applied (8 files examined)

Files examined (source and test): backend/app/main.py, backend/app/routers/uptime.py, backend/app/schemas/uptime.py, backend/app/services/uptime_service.py, backend/tests/integration/test_uptime_integration.py, backend/tests/unit/test_main_unit.py, backend/tests/unit/test_uptime_schema_unit.py, backend/tests/unit/test_uptime_service_unit.py. The plan artifacts are not code and were not analysed.

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/tests/unit/test_uptime_service_unit.py | Hand-written try/except AttributeError with a trailing raise AssertionError (lines 64-72), from Phase E | Excessive complexity | RECOMMENDED | Applied: `with pytest.raises(dataclasses.FrozenInstanceError)`; imports added |
| 2 | backend/tests/unit/test_main_unit.py | `first_app.state.startup_clock is first_app.state.startup_clock` (line 77) compares an attribute with itself, so it is always true | Dead code | OPTIONAL | Not applied: a test-intent change, negligible impact; the neighbouring `is not` assertion carries the real check |

No other findings: naming, layering (router to service, no logic in the router), imports and docstrings conform.

Tests after the change: unit 49 passed; integration 10 passed, 14 skipped (the skipped tests need a database and this run recorded no backing service).
