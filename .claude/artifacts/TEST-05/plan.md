# Implementation Plan, TEST-05: Backend version endpoint

## Feature

> Add a version endpoint to the FastAPI backend that reports the application version from `backend/pyproject.toml` rather than a hardcoded string. Backend only; no frontend, no database. Deliberately trivial, and deliberately disjoint from TEST-04's frontend files so the two can build concurrently in a batch.

Source: `docs/issues/TEST-05.md` (local item, `hybrid` work item source). Type: feature. Depends on: TEST-01 (done, the scaffold).

## Acceptance Criteria

- [ ] 1. `GET /api/version` returns HTTP 200 with JSON `{"version": "<the version from backend/pyproject.toml>"}`.
- [ ] 2. The version is read from package metadata, not hardcoded in the router, service, or schema.
- [ ] 3. The endpoint needs no database connection and answers correctly with `DATABASE_URL` unset.

## Plan Overview

One read-only backend endpoint, three thin layers plus tests. A service function resolves the installed distribution's version through `importlib.metadata.version("task-notes-backend")`; a Pydantic response schema types the payload; a router exposes `GET /api/version` under an `/api` prefix and is registered in the existing `create_app()` factory without restructuring it. No repository layer, no models, no migrations (there is no persistence in this feature), no frontend, no new dependency. The only pre-existing files touched are `backend/app/main.py` (one import plus one `include_router` call) and `backend/tests/unit/test_main_unit.py`, whose `test_create_app_registers_no_feature_routes` asserts the app exposes **no** custom routes and therefore must be updated in the same commit that lands the first router.

### Key decisions and assumptions

1. **Version source: `importlib.metadata.version("task-notes-backend")`.** The distribution name is the `[project].name` in `backend/pyproject.toml` (`task-notes-backend`, currently version `0.1.0`) — not the package name `app`. `backend/uv.lock` records the root project as `source = { editable = "." }`, so `uv sync` and `uv run` install it editable and the metadata resolves in both the local test gate (`cd backend && uv run pytest -q`) and CI (`.github/workflows/pr-tests.yml` runs `uv sync` then `uv run pytest`). This satisfies criterion 2: the string lives only in `pyproject.toml`; the code holds the *distribution name*, never the version.
2. **Assumption — failure mode when the distribution is not installed.** Running from a bare source checkout (e.g. plain `pytest` instead of `uv run pytest`; pytest still imports `app` because `backend/tests/__init__.py` puts `backend/` on `sys.path`, so import success does **not** imply installation) raises `importlib.metadata.PackageNotFoundError`. The service catches it, logs one warning naming the distribution, and returns the sentinel `"unknown"`, so `GET /api/version` stays `200` and never 500s. `"unknown"` is a sentinel, not a version literal, so criterion 2 holds. Alternatives rejected: parsing `pyproject.toml` at runtime with `tomllib` (the file does not exist inside an installed wheel, so it trades a clean failure for a path-resolution guess), and returning `503` (breaks the "always answerable" property this kind of endpoint exists for). The integration test pins the real value against `pyproject.toml`, so a silently-degraded environment is caught by CI rather than shipped.
3. **No exception hierarchy or global handler is introduced.** `coding_standards.md` Section 2.3 prescribes `AppException` plus registered handlers, but the scaffold has neither and this endpoint raises nothing to the client. Adding that infrastructure for one endpoint that cannot fail contradicts `CLAUDE.md` → Architecture Notes ("Keep every feature as small as possible") and `user_story_alignment.md` Section 3. The first feature that actually needs error translation should introduce it.
4. **No new dependency.** `pydantic` is already installed transitively via `fastapi` (present in `backend/uv.lock`), so the schema needs no `pyproject.toml` change. Leaving `pyproject.toml` untouched also keeps `version = "0.1.0"` stable, which criterion 1 is asserted against.
5. **Scope containment.** No `FastAPI(version=...)` change to the OpenAPI document, no `/api/health`, no build/commit metadata, no caching of the lookup, no frontend display of the version. None of it is asked for.
6. **Prefix placement.** `APIRouter(prefix="/api", tags=["version"])` with `@router.get("/version")` yields exactly `/api/version`. `create_app()` calls `app.include_router(version_router)` with no extra prefix, so the path cannot drift.

## Frontend Plan

No frontend changes required. This item is backend-only by design (its file set is deliberately disjoint from TEST-04's frontend work so the two can build concurrently).

## Backend Plan

- **Endpoints:** `GET /api/version` — returns the running application's version. No path, query, or body parameters. No authentication (the project has none).
- **Router layer** (`backend/app/routers/version.py`): `APIRouter(prefix="/api", tags=["version"])`; one handler `get_version()` declared with `response_model=VersionResponse`, calling the service and returning `VersionResponse(version=...)`. No logic beyond that call (`coding_standards.md` Section 2.2: no business logic in routers).
- **Service layer** (`backend/app/services/version_service.py`): module-level constants `DISTRIBUTION_NAME = "task-notes-backend"` and `UNKNOWN_VERSION = "unknown"` (`UPPER_SNAKE_CASE` per Section 2.1); module logger via `logging.getLogger(__name__)` — never `print`. Function `get_app_version() -> str` wraps `importlib.metadata.version(DISTRIBUTION_NAME)` in `try/except PackageNotFoundError`, logging a warning and returning `UNKNOWN_VERSION` on miss.
- **Schemas** (`backend/app/schemas/version.py`): `class VersionResponse(BaseModel)` with a single field `version: str`. Kept separate from the service, per Section 2.2 item 4.
- **Repository layer:** none. This feature reads no data store, which is exactly what criterion 3 requires. `backend/app/repositories/` and `backend/app/models/` stay empty.
- **Migrations:** none.
- **Config:** `backend/app/core/config.py` is **not** modified. `Settings.database_url` already defaults to `os.environ.get("DATABASE_URL")` (i.e. `None` when unset) and nothing in this feature reads it, so criterion 3 is satisfied structurally — no engine, session, or connection is created anywhere on this request path.
- **App factory** (`backend/app/main.py`): add `from app.routers.version import router as version_router` and, inside `create_app()`, `app.include_router(version_router)` before `return app`. The factory's shape, title handling, and module-level `app = create_app()` are unchanged; the file's docstring gets one line noting TEST-05 registers the version router.

## API Integration Plan

No external API integration.

## API Contract

- **Method:** `GET`
- **URL:** `/api/version`
- **Request:** no parameters, no headers required, no body.
- **Response:** `200 OK`, `Content-Type: application/json`

  ```json
  { "version": "0.1.0" }
  ```

  `version` is always a non-empty string. It equals `[project].version` in `backend/pyproject.toml` whenever the `task-notes-backend` distribution is installed (the case in the test gate, in CI, and in the Docker image), and the sentinel `"unknown"` only in an environment where the distribution is absent (assumption 2 above).
- **Error responses:** none defined by this endpoint. It takes no input, so `400`/`422` are unreachable; a wrong HTTP method yields FastAPI's built-in `405 Method Not Allowed`.

## File Manifest

### New files

- `backend/app/routers/version.py`: `APIRouter(prefix="/api", tags=["version"])` exposing `GET /version` with `response_model=VersionResponse`; delegates to the service.
- `backend/app/services/version_service.py`: `get_app_version() -> str`, `importlib.metadata.version(DISTRIBUTION_NAME)` with the `PackageNotFoundError` fallback and warning log.
- `backend/app/schemas/version.py`: `VersionResponse(BaseModel)` with `version: str`.
- `backend/tests/unit/test_version_service_unit.py`: unit tests for `get_app_version()` (happy path, edge case, error case).
- `backend/tests/integration/test_version_integration.py`: router tests through the full HTTP cycle with the shared `client` fixture.

### Modified files

- `backend/app/main.py`: import `version_router` and call `app.include_router(version_router)` inside `create_app()`; one docstring line added. No other change.
- `backend/tests/unit/test_main_unit.py`: `test_create_app_registers_no_feature_routes` currently asserts the app exposes **no** custom routes and goes red the moment any feature router lands. Replace it with `test_create_app_registers_version_route`, asserting `"/api/version"` is among the app's route paths (keeping the same built-in-path exclusion set). `test_create_app_returns_expected_title` and `test_create_app_returns_independent_instances` are untouched.

Not modified: `backend/pyproject.toml`, `backend/uv.lock`, `backend/tests/conftest.py`, `backend/app/core/config.py`, anything under `frontend/`, `e2e/`, or `.github/`.

## Testing Strategy

Tiers judged per `testing_standards.md` Section 6 rather than assumed; two of four are warranted.

- **Unit tests: WARRANTED** — the feature adds service-layer logic (metadata lookup plus fallback branch).
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` → `backend/tests/unit/test_version_service_unit.py`
  - Cases (`test_{action}_{scenario}_{outcome}` per Section 3), all isolated with `monkeypatch` against `importlib.metadata.version` — no HTTP, no filesystem:
    1. `test_get_app_version_returns_installed_distribution_version` — happy path: patched metadata returns `"9.9.9"`, the function returns `"9.9.9"` verbatim (proves passthrough, no rewriting or hardcoding).
    2. `test_get_app_version_queries_the_project_distribution_name` — edge case: the lookup is issued for `task-notes-backend`, i.e. the distribution name from `pyproject.toml`, not the `app` package name (the mistake that would make this endpoint fail only in a real install).
    3. `test_get_app_version_returns_unknown_when_distribution_not_installed` — error case: `PackageNotFoundError` is raised, the function returns `"unknown"` and does not propagate.
  - Also covered by the modified `backend/tests/unit/test_main_unit.py`: the app factory registers `/api/version`.
  - Coverage: the service is the only business logic added and all three of its branches are exercised, clearing the 80% bar.
- **Integration tests: WARRANTED** (toggle ENABLED) — the feature adds an API endpoint, which Section 6 routes to the integration tier, and Section 1.2 defines a router test as the real HTTP request/response cycle.
  - Directory: `backend/tests/integration/` (first file in it; `backend/tests/integration/__init__.py` already exists)
  - Naming: `test_{module}_integration.py` → `backend/tests/integration/test_version_integration.py`
  - Uses the existing session-scoped `client` fixture from `backend/tests/conftest.py`. **`conftest.py` is not modified** — no database fixture is added or needed, which is the point of criterion 3.
  - Cases:
    1. `test_get_version_returns_200_with_version_from_pyproject` — happy path, and the direct proof of criterion 1: the test reads `[project].version` from `backend/pyproject.toml` with `tomllib` (path derived from the test file's location, not hardcoded) and asserts the response is `200` and its JSON equals `{"version": "<that value>"}`. Nothing is mocked. This also catches a degraded environment: if the distribution is not installed the endpoint answers `"unknown"` and this test fails loudly instead of the fallback shipping unnoticed.
    2. `test_get_version_answers_when_database_url_is_unset` — criterion 3: with `DATABASE_URL` removed from the environment (`monkeypatch.delenv(..., raising=False)`) and a client built from a fresh `create_app()`, the endpoint still returns `200` and the same payload.
    3. `test_post_version_returns_405_method_not_allowed` — the endpoint's only reachable error case. It accepts no input, so `422`/`400` cannot be provoked and a `404` case would test FastAPI, not this feature; asserting the read-only contract is the honest substitute.
- **E2E tests: NOT WARRANTED — skipped** (toggle is ENABLED, but the tier is not applicable): the feature has no user-facing surface, no navigation and no interaction, and `testing_standards.md` Section 5 explicitly forbids an E2E spec that calls the API directly, since that is a router integration test — which case 1 above already is. Nothing is added under `e2e/tests/`.
  - Directory that would have been used: `e2e/tests/`, file `TEST-05_version_endpoint.spec.ts` — deliberately not created.
- **UAT scenarios: NOT WARRANTED — skipped** (toggle is ENABLED, tier not applicable): a UAT artifact is a stakeholder clickthrough of the UI, and this item ships no UI, so the manual script would degrade to a single `curl` that duplicates the integration test's assertion (Section 5, "do not duplicate E2E interaction assertions in UAT"). Nothing is added under `e2e/uat/`.
  - Directory that would have been used: `e2e/uat/scenarios/` — deliberately not created. If plan review wants a paper trail anyway, the cheap addition is a Gherkin file with one API-level scenario per criterion; it is left out here by decision, not oversight.

The test gate (`cd backend && uv run pytest -q && cd ../frontend && npm test`) runs unchanged and must be green before the commit; `uv run` guarantees the editable install that the metadata lookup and integration case 1 depend on.

## Acceptance Test Outline

| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `{"version": "<version from pyproject.toml>"}` | Not applicable — no UI to drive; covered by router integration test `test_get_version_returns_200_with_version_from_pyproject`, which compares the response against `pyproject.toml` parsed with `tomllib` | Skipped (no UI). Equivalent manual check: `curl -s localhost:8000/api/version` returns `{"version":"0.1.0"}` |
| 2 | The version comes from package metadata, not a hardcoded string | Not applicable — no UI; covered by unit tests 1 and 2 (patched metadata value is returned verbatim; the lookup uses the `task-notes-backend` distribution name) plus a grep-level review check that no version literal appears in the router, service, or schema | Skipped (no UI). Equivalent manual check: bump `[project].version` in `backend/pyproject.toml`, re-run `uv sync`, and confirm the endpoint reports the new value with no code change |
| 3 | Endpoint needs no database and answers with `DATABASE_URL` unset | Not applicable — no UI; covered by integration test `test_get_version_answers_when_database_url_is_unset`, plus the structural fact that no repository, engine, or session is touched on this path | Skipped (no UI). Equivalent manual check: start the backend with `DATABASE_URL` unset and with Postgres stopped; the endpoint still returns 200 |
