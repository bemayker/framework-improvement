# Refactor Gate Report — TEST-02 (Health endpoint)

- Run: `build-feature-20260813T074117Z`, Phase F (build-feature Section 13), single pass after Phase E.
- Branch: `feature/TEST-02-health-endpoint`
- Scope analysed: the backend files this feature created or modified (`backend/app/core/db.py`, `backend/app/main.py`, `backend/app/routers/health.py`, `backend/app/schemas/health.py`, `backend/app/services/health_service.py`, `backend/tests/unit/test_health_service_unit.py`, `backend/tests/unit/test_main_unit.py`, `backend/tests/integration/test_health_integration.py`), plus the two files Phase E's RECOMMENDED findings named.

## Findings

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/app/services/health_service.py | Phase E RECOMMENDED 1: `_attempted_target` calls `int(port)` unguarded (line 81), so a non-numeric port in `DATABASE_URL` raises `ValueError` out of `get_health()` on the failure path — a 500 where the contract says 503 | Excessive complexity (unguarded failure path) | RECOMMENDED | Applied. Parse defensively: `None` → `DEFAULT_POSTGRES_PORT`, non-numeric → `(host, None)` with a logged reason; docstring now states the function never raises |
| 2 | backend/tests/unit/test_health_service_unit.py | No test covers the non-numeric-port branch finding 1 introduces | Test coverage (mandatory input, `refactoring_standards.md` Section 3) | RECOMMENDED | Applied. Added `test_get_health_returns_degraded_without_a_port_when_the_url_port_is_not_numeric`; **no file created** — the case fits the existing unit module's convention |
| 3 | .github/workflows/pr-tests.yml | Phase E RECOMMENDED 2: the integration step sets `DATABASE_URL` host port 5432 while `docker-compose.yml` publishes `5442:5432`, so the tier cannot reach the database in CI | Configuration consistency (`coding_standards.md` Section 5) | RECOMMENDED | Applied. Port literal 5432 → 5442 (line 283) and the now-wrong explanatory comment corrected to name the published port |
| 4 | backend/tests/unit/test_main_unit.py | The built-in FastAPI route set `{"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}` is written twice (lines 43 and 53); the second copy arrived with this feature's health-route test | DRY violations | RECOMMENDED | Applied. Extracted to a module-level `BUILT_IN_ROUTE_PATHS` constant with a comment explaining why it is subtracted |
| 5 | .github/workflows/pr-tests.yml + docker-compose.yml | The host port is still a literal in two files rather than resolved from the compose file at run time (`coding_standards.md` Section 5, "one value, one source"). The consistency check passes on the literal, so nothing is broken today, but the pair moves together by hand | Configuration consistency | OPTIONAL | Not applied. Deriving it in-step (`docker compose port db 5432`) is a mechanism change to a CI path that cannot be verified locally; recorded for a later change |
| 6 | backend/tests/unit/test_health_service_unit.py + backend/tests/integration/test_health_integration.py | `UNREACHABLE_DATABASE_URL` is defined identically in both test modules | DRY violations | OPTIONAL | Not applied. Extraction would cross the unit/integration tier boundary (`refactoring_standards.md` Section 5 rule 5) for one string literal — a hasty abstraction |

Categories 1 (naming), 3 (dead code), 5 (layered-architecture drift), 6 (import hygiene) and 7 (file structure) produced no findings on the analysed set.

**Not this pass's input:** Phase E's OPTIONAL finding (the `Literal["ok", "degraded"]` typing on `HealthResponse.status` versus the plain `str` on `HealthReport.status`) is excluded by `review_standards.md` Section 6.3 and was left untouched.

**Files created by this gate:** none. The mandatory test finding was applied inside the existing `backend/tests/unit/test_health_service_unit.py`.

## Verify-by-running outcomes (recorded verbatim)

### RECOMMENDED 1 — before the fix

Command: `cd backend && DATABASE_URL='postgresql://tasknotes:tasknotes@db:notaport/tasknotes' uv run python -c "from app.services.health_service import get_health; print(get_health())"`

```
psycopg.OperationalError: failed to resolve host 'db': [Errno 8] nodename nor servname provided, or not known

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "<string>", line 1, in <module>
    from app.services.health_service import get_health; print(get_health())
                                                              ~~~~~~~~~~^^
  File ".../app/services/health_service.py", line 53, in get_health
    attempted_host, attempted_port = _attempted_target(database_url)
                                     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^
  File ".../app/services/health_service.py", line 81, in _attempted_target
    return host, DEFAULT_POSTGRES_PORT if port is None else int(port)
                                                            ~~~^^^^^^
ValueError: invalid literal for int() with base 10: 'notaport'
EXIT=1
```

The finding is **confirmed**: the `ValueError` escapes `get_health()`, which under FastAPI is a 500 rather than the 503 the endpoint contract defines.

### RECOMMENDED 1 — after the fix

```
DATABASE_URL names a non-numeric port 'notaport', so the degraded report names the host with no port.
Database health probe failed for db:None: failed to resolve host 'db': [Errno 8] nodename nor servname provided, or not known
HealthReport(status='degraded', host='db', port=None)
```

No exception; the degraded verdict is returned with a logged reason.

### RECOMMENDED 2 — before the fix

Command: `bash "$CLAUDE_PLUGIN_ROOT/hooks/lib/config-consistency.sh" ports .`

```
[config-consistency] .github/workflows/pr-tests.yml:283: unpublished-host-port: host port 5432 is written into this workflow and docker-compose.yml does not publish it. Published: 5183 5442 8010. Resolve the port from the compose file at run time instead — a comment telling a human to keep the two in step is not a mechanism.
[config-consistency] 1 violation(s) of the one-source-per-deployment-dependent-value invariant (coding_standards.md Section 5).
EXIT=1
```

The finding is **confirmed** (exit 1, not exit 2), so the minimal fix was applied.

### RECOMMENDED 2 — after the fix

```
EXIT=0
```

No output, exit 0.

## Test results after refactoring

| Tier | Command | Result |
| --- | --- | --- |
| Unit | `cd backend && env -u DATABASE_URL uv run pytest tests/unit -q` | 32 passed, 0 failed, 0 skipped (31 before this pass; +1 is the new non-numeric-port test) |
| Integration | `cd backend && DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run pytest tests/integration -q` | 19 passed, 0 failed, 0 skipped, against the run's recorded compose database on host port 5442 |

No behaviour change on any passing path: the same 19 integration and 31 pre-existing unit assertions hold. The one intentional behaviour change is on a path that previously raised — an unparseable port now degrades instead of erroring — which is exactly the mandatory review finding this pass applied, and the response schema already permitted a null port.

Backing services: connected to the `- env:` line recorded for `run=build-feature-20260813T074117Z` (compose service `db`, container `framework-improvement-db-1`, host port 5442). Nothing provisioned, nothing torn down.
