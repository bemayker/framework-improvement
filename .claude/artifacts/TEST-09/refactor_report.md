# Refactor report: TEST-09

Gate result: 2 improvements applied (9 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/Dockerfile, docker-compose.yml | BUILD_COMMIT ARG to ENV path never exercised (review RECOMMENDED) | Verification | RECOMMENDED | Ran `docker build --build-arg BUILD_COMMIT=abc1234` then `docker run --rm test09-backend printenv BUILD_COMMIT`, output `abc1234`. No change needed. Test image removed. |
| 2 | backend/tests/unit/test_config_unit.py | Module docstring said database_url is evaluated once at class definition; it is now a default_factory (review OPTIONAL) | Dead code / stale comment | OPTIONAL | Docstring and inline comment rewritten to describe per-call reads |
| 3 | backend/tests/integration/test_version_integration.py | test_get_version_reports_short_build_commit_unchanged lacked a status assert (review OPTIONAL) | Test hygiene | OPTIONAL | Added `assert response.status_code == 200` |

No files created. Other scope files (config.py, version_service.py, schemas/version.py, routers/version.py, test_version_service_unit.py) examined, no findings.
