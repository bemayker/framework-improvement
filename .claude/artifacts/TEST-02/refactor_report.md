# Refactor gate report — TEST-02

Run: `build-feature-20260810T160626Z` | Phase F (build-feature Section 13) | Refactor Gate: ENABLED
Branch: `feature/TEST-02-health-endpoint` | Project mode: greenfield
Scope: the files this branch added or modified (backend health router/schema/service, `backend/app/main.py`, the three test files, the E2E spec). Framework state under `.claude/` and `project_state.json` is not code and was not analysed.

## Findings

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/tests/unit/test_main_unit.py | The built-in route-path literal `{"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}` is duplicated (lines 43 and 53); Phase B added the second copy alongside TEST-05's | DRY violations | RECOMMENDED | **APPLIED** — extracted to a module-level `BUILT_IN_ROUTE_PATHS` constant; both tests subtract it |
| 2 | .github/workflows/pr-tests.yml | R1 (Phase E, mandatory input): the integration step sets `DATABASE_URL` host port 5432 while `docker-compose.yml:10` publishes the db as `5442:5432`, so the whole integration tier is set up to fail in CI | Layered-architecture drift (n/a — CI configuration) | RECOMMENDED | **DECLINED** — CI configuration, not behaviour-preserving code refactoring; outside this gate's mandate and outside TEST-02's scope. Substance confirmed (see the discharge record below). The Section 18 CI watch owns the fix when the tier goes red |
| 3 | backend/app/services/health_service.py | The probe opens its own psycopg connection rather than going through `app/repositories/`, where a repository layer already exists for notes | Layered-architecture drift | OPTIONAL | **NOT APPLIED** — considered and rejected on the merits: `NoteRepository` takes a caller-supplied connection and owns no connection lifecycle, so it presupposes a successful connect, which is exactly what the probe is testing. A health repository would need a new file (self-directed file creation is forbidden here, Section 3) and would change a cross-module boundary (Section 5 rule 5) |
| 4 | backend/tests/unit/test_health_service_unit.py | `_FakeCursor` and `_FakeConnection` repeat identical `__enter__`/`__exit__` boilerplate; three tests repeat the same `monkeypatch.setenv("DATABASE_URL", …)` line | DRY violations | OPTIONAL | **NOT APPLIED** — a shared base class or fixture would hide setup that is part of each test's story for one saved line per test; net readability loss |
| 5 | backend/app/services/health_service.py | The nested `with psycopg.connect(...)` / `with connection.cursor()` could be one combined `with` statement | Excessive complexity | OPTIONAL | **NOT APPLIED** — pure style preference at two levels of nesting; the current form keeps the connection and cursor lifetimes visually distinct |

Checked with no finding: naming (all `snake_case` functions, `UPPER_SNAKE_CASE` module constants, `PascalCase` schema), dead code (no unused imports, no commented-out blocks, no unreachable branches — verified against the unit tier's coverage of every branch in `check_database_connectivity`), complexity (largest function is 20 LOC, one conditional deep), import hygiene (no wildcard imports, no circular imports, no reaching into another module's internals; `main.py`'s router imports stay alphabetical), file and component structure (one concern per file, filenames match their subject), E2E spec (no duplicated constant with the other three specs — a shared backend-URL helper would require creating `e2e/helpers/`, which is outside the mandate).

## R1 discharge record (mandatory input, `Verify by running:`)

**Command run:**

```
cd backend && DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5432/tasknotes uv run pytest tests/integration -q
```

**What it returned:** `2 passed, 17 errors in 1.05s`. Every error is the same fixture-level failure, not an assertion failure:

```
connection to server at "127.0.0.1", port 5432 failed: FATAL:  password authentication failed for user "tasknotes"
```

**Adjudication: the local run is confounded and settles nothing either way; the finding's substance is confirmed by reading, and the fix is declined as out of mandate.**

- On this machine host port 5432 is occupied by an unrelated project's Postgres (container `pricing-postgres`, different credentials), so the probe got an *authentication* failure from a live server. The CI condition the finding describes is an *empty* port. Different failure mode, so this run neither reproduces nor refutes it — and a local pass would have been equally meaningless, since it would only prove some database happens to answer on 5432 here.
- The observed shape also differs from the finding's prediction: the failure surfaced in the session-scoped `client` fixture (its lifespan runs `ensure_schema`, which raises), erroring 17 tests, rather than producing the clean 503 that fails `assert response.status_code == 200`. In CI the same fixture path is hit first, so the tier goes red more broadly than R1 predicted, not less.
- The substance is verifiable by reading and is confirmed: `.github/workflows/pr-tests.yml:99` sets `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5432/tasknotes`, `docker-compose.yml:10` publishes the db as `"5442:5432"`, and `.env.example:11` documents the host form as `5442`. Nothing publishes host 5432 in CI, and the workflow's own comment at line 96 ("reaches the db service through its published 5432 port") is stale relative to the port offset commit. R1 is a real, latent, tier-wide break that this branch did not introduce.
- **Declined here** (`review_standards.md` Section 6.3 allows a finding listed with the reason it was not applied): the fix is a one-line edit to CI configuration. That is not behaviour-preserving refactoring of this feature's code, it is outside TEST-02's scope, and `pr-tests.yml`, `docker-compose.yml` and `.env.example` were all explicitly out of bounds for this dispatch. The Section 18 CI watch owns it when the integration tier goes red on this PR, and it belongs in the PR description as a known issue.

## Test re-run after the applied change

| Tier | Command | Result |
| --- | --- | --- |
| unit | `cd backend && env -u DATABASE_URL uv run pytest tests/unit -q` | 31 passed, 0 failed |
| integration | `cd backend && DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:55013/tasknotes uv run pytest tests/integration -q` | 19 passed, 0 failed |

Integration ran against this run's recorded backing service (`TEST-02-db`, host-assigned port 55013, from the `- env:` line of `run=build-feature-20260810T160626Z`). Nothing was provisioned and nothing torn down. Both lines are appended to the run record.

## Files created

`.claude/artifacts/TEST-02/refactor_report.md` (this report) only. No source or test file was created; the one applied change is a modification.
