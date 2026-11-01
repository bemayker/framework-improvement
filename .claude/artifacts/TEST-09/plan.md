# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> A client can ask the API which build it is talking to.
>
> Acceptance criteria:
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. Registers a router in `backend/app/main.py`, which TEST-06, TEST-07 and FEAT-1 also touched; all three are complete. Depends on: TEST-01.

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. When `BUILD_COMMIT` is longer than 12 characters, `commit` returns only its first 12 (tracker comment, see Re-Plan Feedback).
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: criterion 2 now carries the 12-character truncation; the service layer slices the configured value to its first 12 characters (`get_build_commit()`), the variable name is `BUILD_COMMIT`, and the unit and integration tests pass a full 40-character sha and assert the 12-character result. A value of 12 characters or fewer (including the `unknown` default) is returned unchanged. Assumption recorded: a blank or whitespace-only `BUILD_COMMIT` is treated as unset (reports `unknown`), because `docker-compose.yml` passes it through as `${BUILD_COMMIT:-}`, which is blank on a local run; surrounding whitespace is stripped before slicing.
- Assumption (description note, not a comment): the description says this item "registers a router in `backend/app/main.py`". The version router (`backend/app/routers/version.py`, TEST-05) is already registered there (`app.include_router(version_router)`), so this plan extends that router's response and does **not** modify `main.py`. No second router and no second `/api/version` route is created.
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only. Extend the existing `GET /api/version` endpoint (TEST-05) so its response also carries `commit`:

- `backend/app/core/config.py` gains one declared source, `Settings.build_commit`, read per call from the `BUILD_COMMIT` environment variable through a `default_factory` (the same shape as `database_url` and `cors_origins`, so the module keeps reading every deployment-dependent value from the environment, `coding_standards.md` Section 5's invariant). Unset, blank or whitespace-only resolves to the documented default `UNKNOWN_BUILD_COMMIT = "unknown"`.
- `backend/app/services/version_service.py` gains `get_build_commit()`, which returns `get_settings().build_commit[:12]` (constant `BUILD_COMMIT_LENGTH = 12`). The truncation is business logic and lives in the service, never the router.
- `backend/app/schemas/version.py`'s `VersionResponse` gains `commit: str`.
- `backend/app/routers/version.py` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`. No literal in the router.
- `docker-compose.yml`'s backend service passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through, which is what `docs/DEVELOPMENT.md` already documents (its `BUILD_COMMIT` paragraph), so the documented build-time wiring is true.

Layering stays Router to Service to Settings. No database access, no new dependency, no frontend change (TEST-10 owns the footer).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05): response gains `commit`. No new endpoint, no new router, no change to `backend/app/main.py`.
- Service layer: `get_build_commit() -> str` in `backend/app/services/version_service.py`: reads `get_settings().build_commit` per call (no caching, so a changed environment is reflected on the next request) and returns its first `BUILD_COMMIT_LENGTH` (12) characters. `get_app_version()` is unchanged.
- Settings: `backend/app/core/config.py` adds `UNKNOWN_BUILD_COMMIT = "unknown"`, a `_read_build_commit()` helper (`os.environ.get("BUILD_COMMIT")`, stripped; empty resolves to `UNKNOWN_BUILD_COMMIT`), and the field `build_commit: str = field(default_factory=_read_build_commit)` with a comment naming the variable and its default.
- Schema: `VersionResponse` adds `commit: str`.
- Runtime wiring: `docker-compose.yml` backend `environment:` adds `BUILD_COMMIT: ${BUILD_COMMIT:-}`.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response 200, `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

- Response 200, `BUILD_COMMIT` unset or blank:

```json
{"version": "0.1.0", "commit": "unknown"}
```

- `version` is the installed distribution version (unchanged from TEST-05, `unknown` when the distribution is not installed). `POST /api/version` stays 405.

## Technology Selection
- Reading `BUILD_COMMIT`: chose the standard library `os.environ` inside the existing `Settings` dataclass over adding `pydantic-settings` or `python-dotenv`, because `config.py` already reads every other value this way and a few lines cover it.
- Truncating to 12 characters: chose a plain string slice over any git or sha library, because the value is an opaque string the build hands in and nothing about it needs parsing.
- Response field: chose to extend the existing Pydantic `VersionResponse` (an installed dependency, via FastAPI) over a new schema, because the endpoint and its schema already exist.
- No net-new module, component or dependency is introduced; every change extends an existing file.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-09_version_build_commit.feature: Gherkin scenarios, one per criterion plus the truncation edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-09_version_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/TEST-09/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/core/config.py: add `UNKNOWN_BUILD_COMMIT`, `_read_build_commit()` and the `Settings.build_commit` field read per call from `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit()`.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: return `commit=get_build_commit()` alongside `version`.
- [B] docker-compose.yml: backend service passes `BUILD_COMMIT: ${BUILD_COMMIT:-}` through.
- [B] backend/tests/unit/test_config_unit.py: `build_commit` set, unset and blank cases.
- [B] backend/tests/unit/test_version_service_unit.py: `get_build_commit()` short value, 40-character truncation to 12, and unset default cases.
- [B] backend/tests/integration/test_version_integration.py: existing assertions updated to expect `commit`; add set (40-character sha returns first 12) and unset (`unknown`) request/response tests.

No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: `docs/DEVELOPMENT.md` already documents `BUILD_COMMIT` (the 12-character truncation, the `${BUILD_COMMIT:-}` compose passthrough and the `unknown` default in `backend/app/core/config.py`), and this plan implements exactly that; the build's Section 15 check confirms it.

## Testing Strategy
- Unit tests: `Settings.build_commit` resolution (set, unset, blank/whitespace) in `test_config_unit.py`; `get_build_commit()` in `test_version_service_unit.py`: happy path (a value of 12 characters or fewer returned verbatim), edge case (a 40-character sha returns its first 12), unset path (returns `unknown`), all via `monkeypatch.setenv` / `monkeypatch.delenv("BUILD_COMMIT")` so the real resolution is asserted, not a patched literal.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/version` full HTTP cycle through the session `client` fixture (settings are read per request, so `monkeypatch` on `BUILD_COMMIT` takes effect): set path (`BUILD_COMMIT` = 40-character sha, body `commit` equals its first 12 and `version` equals pyproject's), unset path (`commit` is `unknown`), the existing DATABASE_URL-unset test and the 405 test kept, the two existing equality assertions updated to include `commit`. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion requires navigation or interaction through the UI (backend only, no frontend change); every criterion is covered at unit or integration level below.
  - Directory: e2e/tests/
  - File: none for this item (would be TEST-09_version_build_commit.spec.ts)
- UAT scenarios: one scenario per criterion plus the 40-character truncation edge case, run against the API.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | verifying it needs no navigation or interaction: it is a router response shape, checked through the real HTTP cycle |
| 2 | `commit` comes from `BUILD_COMMIT` (default `unknown`, first 12 characters of a longer value), never a router literal | Unit | verifying it needs no navigation or interaction: it is settings resolution and a service rule, checked by setting and unsetting the variable |
| 3 | The response body is a Pydantic schema in `backend/app/schemas/` | Integration | verifying it needs no navigation or interaction: the router declares `response_model=VersionResponse` and the integration test asserts the exact body the schema produces |
| 4 | Unit and integration tests cover the set and unset commit paths | Unit and Integration | verifying it needs no navigation or interaction: the criterion is the existence and passing of those tests themselves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/version Then the status is 200 and the body has string fields version and commit |
| 2 | `commit` from `BUILD_COMMIT`, default `unknown`, truncated to 12 | covered at Unit, see Criterion coverage | Given BUILD_COMMIT is a 40-character sha When GET /api/version Then commit is its first 12 characters; Given BUILD_COMMIT is unset Then commit is unknown |
| 3 | Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the API docs at /docs When the version endpoint is inspected Then its response schema is VersionResponse with version and commit |
| 4 | Tests cover set and unset paths | covered at Unit and Integration, see Criterion coverage | Given the backend test suite When the version tests run Then 0 failed |

## Manual verification plan
This feature has no UI: every criterion is verified against the running API with curl, through the API docs page, or by running the tests. Prerequisites for all blocks: Docker running, repository root as the working directory, port 8010 free.

### Criterion 1: `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`
Prerequisites: backend started with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend`, then wait until `docker compose ps backend` shows it running.
1. Run `curl -s -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK`.
2. Read the body → it is exactly `{"version":"0.1.0","commit":"0123456789ab"}` (the version is the `[project].version` in `backend/pyproject.toml`); both values are strings in quotes.

### Criterion 2: `commit` comes from `BUILD_COMMIT`, default `unknown`, first 12 characters of a longer value
Prerequisites: the backend from Criterion 1 still running with the 40-character `BUILD_COMMIT`.
1. Run `curl -s http://localhost:8010/api/version` → `commit` is `0123456789ab`, the first 12 of the 40 characters passed in, not the full sha.
2. Run `BUILD_COMMIT=abc1234 docker compose up -d backend`, then `curl -s http://localhost:8010/api/version` → `commit` is `abc1234` (7 characters, returned unchanged).
3. Run `docker compose up -d backend` with `BUILD_COMMIT` not set in your shell (run `unset BUILD_COMMIT` first), then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
4. Open `backend/app/routers/version.py` → it contains no commit string literal; `commit` comes from `get_build_commit()`.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running (any `BUILD_COMMIT`).
1. Open `http://localhost:8010/docs` in a browser → the Swagger UI lists `GET /api/version`.
2. Expand `GET /api/version` and open its 200 response schema → it is named `VersionResponse` and lists two required string fields, `version` and `commit`.
3. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: none beyond `uv` installed (these tests need no database).
1. Run `uv run --directory backend pytest -q tests/unit/test_version_service_unit.py tests/unit/test_config_unit.py tests/integration/test_version_integration.py` → the summary line reports `0 failed`.
2. Read the test names in those three files → each file has at least one test that sets `BUILD_COMMIT` and one that unsets it.
3. Clean up with `docker compose down`.
