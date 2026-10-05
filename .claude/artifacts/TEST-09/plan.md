# Implementation Plan, TEST-09: Version endpoint reports the build commit

## Feature
> **TEST-09: Version endpoint reports the build commit**
>
> What: A client can ask the API which build it is talking to.
>
> Acceptance criteria:
> 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
> 2. `commit` comes from one declared source (an environment variable set at build time, default `"unknown"`), never a string typed into the router.
> 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
> 4. Unit and integration tests cover the set and unset commit paths.
>
> Notes: Backend only. Registers a router in backend/app/main.py (already touched by TEST-06, TEST-07, FEAT-1, all complete). `backend/app/routers/version.py` and `schemas/version.py` already exist on main (from TEST-05, which shipped GET /api/version returning the version): extend them, do not duplicate. Depends on: TEST-01 (done).

## Acceptance Criteria
- [ ] 1. `GET /api/version` returns 200 with `{"version": "<string>", "commit": "<string>"}`.
- [ ] 2. `commit` comes from one declared source (the `BUILD_COMMIT` environment variable, set at build time, default `"unknown"`), never a string typed into the router. Amended by the tracker comment below: a value longer than 12 characters is returned as its first 12.
- [ ] 3. The response body is defined by a Pydantic schema in `backend/app/schemas/`.
- [ ] 4. Unit and integration tests cover the set and unset commit paths.

## Re-Plan Feedback
- Comment (tracker): "Clarification from review: when BUILD_COMMIT is longer than 12 characters, `commit` returns only its first 12. A full 40-character sha is what CI passes in." → Addressed by: the comment overrides the description where they disagree (the description says nothing about length), so `version_service.get_build_commit()` returns the configured value cut to its first 12 characters (`BUILD_COMMIT_LENGTH = 12`). Values of 12 characters or fewer, including the `"unknown"` default, are returned unchanged. Unit tests cover 40 chars (cut to 12), exactly 12 (unchanged), shorter (unchanged); the integration test sets a 40-character sha and asserts the 12-character prefix.
- Comment (tracker): framework PR-link notice from a previous run whose code was since reset off main → not acted on because it carries no requirement; that PR's code is not on main, so this plan starts from main as it stands (befe062).
- Assumption (no comment, recorded in place of a question): the item's note "Registers a router in backend/app/main.py" is already satisfied on main. TEST-05 registered `version_router` in `create_app()`, so this plan extends that router and does NOT modify `backend/app/main.py` (no second router, no duplicate route).
- Assumption: "the 12 characters" means the raw string's first 12 characters after surrounding whitespace is stripped; no hex validation and no lower-casing (not asked for; no gold plating).
- Assumption: a blank or whitespace-only `BUILD_COMMIT` counts as unset and yields `"unknown"`, matching how `CORS_ORIGINS` treats a blank value in the same settings module. This is what lets the Dockerfile declare the build arg with an empty default while the single default stays in `config.py`.
- Assumption: wiring CI to pass `github.sha` into the image build is out of scope. The comment describes the input CI supplies; `.github/workflows/pr-tests.yml` is a framework-managed template and the criteria do not ask for a CI change. This plan makes the build-time path exist (Dockerfile build arg, compose build arg) so any build that sets `BUILD_COMMIT` gets it.
- Merged since the last plan: n/a (fresh plan, branched from current main befe062).

## Plan Overview
Extend the existing TEST-05 version endpoint so its body also carries the build commit. Backend only, four layers:
1. **Config** (`backend/app/core/config.py`): a new `build_commit` setting read per call from `BUILD_COMMIT`, stripped, blank treated as unset, default `DEFAULT_BUILD_COMMIT = "unknown"`. This is the one declared source (criterion 2) and follows `coding_standards.md` Section 5's invariant: every deployment/build-dependent value in this settings module reads the environment with a documented default, exactly like `database_url` and `cors_origins`.
2. **Service** (`backend/app/services/version_service.py`): `get_build_commit()` reads `get_settings().build_commit` and returns its first 12 characters (tracker comment).
3. **Schema** (`backend/app/schemas/version.py`): `VersionResponse` gains `commit: str` (criterion 3).
4. **Router** (`backend/app/routers/version.py`): passes `commit=get_build_commit()`; no literal in the router (criterion 2).

Build-time wiring: `backend/Dockerfile` declares `ARG BUILD_COMMIT` (empty default) and exports it as `ENV BUILD_COMMIT`; `docker-compose.yml` forwards the host's `BUILD_COMMIT` as a build arg with an empty default; `.env.example` documents the variable. The default value `"unknown"` lives only in `config.py` (one value, one source).

No frontend, no database, no migration, no new dependency. `backend/app/main.py` is unchanged.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; and this item has no UI).

## Backend Plan
- Endpoints: `GET /api/version` (existing, TEST-05), response extended with `commit`. No new endpoint, no new router, no change to router registration in `backend/app/main.py`.
- Config: in `backend/app/core/config.py` add `DEFAULT_BUILD_COMMIT = "unknown"`, a private `_read_build_commit()` returning `(os.environ.get("BUILD_COMMIT") or "").strip() or DEFAULT_BUILD_COMMIT`, and a `Settings.build_commit: str = field(default_factory=_read_build_commit)` field with a one-line comment naming the variable, its build-time origin and its default. Read per call (default_factory), never at import, so `get_settings()` stays fresh as the module docstring promises.
- Service layer: in `backend/app/services/version_service.py` add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit() -> str` returning `get_settings().build_commit[:BUILD_COMMIT_LENGTH]`. Docstring says why 12 (the tracker clarification; CI passes a 40-character sha). Existing `get_app_version()` unchanged.
- Schema: `VersionResponse` in `backend/app/schemas/version.py` gets `commit: str` after `version: str`, with the module docstring updated to name TEST-09.
- Router: `get_version()` in `backend/app/routers/version.py` returns `VersionResponse(version=get_app_version(), commit=get_build_commit())`; docstring names TEST-09.
- Build-time source: `backend/Dockerfile` adds, after the second `uv sync` and before `EXPOSE` (so dependency layers stay cached when the commit changes), `ARG BUILD_COMMIT=` followed by `ENV BUILD_COMMIT=` set from that arg. `docker-compose.yml` → `services.backend.build` gains an `args:` map with `BUILD_COMMIT` interpolated from the host environment with an empty default, in the same dollar-brace colon-dash interpolation form the file already uses for `CORS_ORIGINS`. Do NOT add `BUILD_COMMIT` to the backend service's runtime `environment:` block, so the image's build-time value is what the container sees.
- Repository layer: none (no data access).
- Migrations: none.
- Section 5 check: after the config change, run `bash ~/.mayker/mayker-dev/hooks/lib/config-consistency.sh settings backend/app/core/config.py` and report its exit (2 is "could not check", never a pass).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version`
- Request: no body, no query parameters.
- Response 200, `application/json`, schema `VersionResponse`:
  - `version` (string): installed distribution version, unchanged from TEST-05 (currently `0.1.0`).
  - `commit` (string): `BUILD_COMMIT` stripped and cut to its first 12 characters; `"unknown"` when unset or blank.
- Example, built with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`: `{"version": "0.1.0", "commit": "0123456789ab"}`
- Example, `BUILD_COMMIT` unset: `{"version": "0.1.0", "commit": "unknown"}`
- Other methods: `POST /api/version` stays 405 (unchanged).

## Technology Selection
- `BUILD_COMMIT` setting: chose a `default_factory` field on the existing stdlib `dataclasses` `Settings` reading `os.environ` over adding `pydantic-settings` (not installed) or reading `git` at runtime (no `.git` in the image, and it would not be the build-time value), because the existing settings module already covers the need with the stdlib.
- Commit truncation: chose a stdlib string slice (`[:12]`) in the service over a Pydantic `constr`/validator on the schema, because truncation is business logic, not validation: a validator would reject a 40-character value instead of shortening it.
- Build-time injection: chose the native Dockerfile `ARG` → `ENV` plus the Compose `build.args` map (both already in use by this project's toolchain) over a generated version file or a build script, because the platform feature covers it with no new file.
- No new dependency is introduced; no lockfile changes.

## File Manifest
### New files
- [B] backend/tests/unit/test_version_unit.py: unit tests for `VersionResponse` (requires both `version` and `commit`; exact field set) and the `get_version` handler (returns the service's commit, not a literal, with the service monkeypatched).
- [G] e2e/uat/scenarios/TEST-09_version-build-commit.feature: Gherkin scenarios, one per acceptance criterion plus the 40-character edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-09_version-build-commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-09/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/config.py: add `DEFAULT_BUILD_COMMIT`, `_read_build_commit()`, `Settings.build_commit`; extend the module docstring by one sentence naming `BUILD_COMMIT`.
- [B] backend/app/services/version_service.py: add `BUILD_COMMIT_LENGTH = 12` and `get_build_commit()`; import `get_settings`; docstring names TEST-09.
- [B] backend/app/schemas/version.py: add `commit: str` to `VersionResponse`.
- [B] backend/app/routers/version.py: pass `commit=get_build_commit()` into `VersionResponse`.
- [B] backend/Dockerfile: `ARG BUILD_COMMIT=` and `ENV BUILD_COMMIT` from it, placed after the dependency/project `uv sync` layers and before `EXPOSE`.
- [B] docker-compose.yml: `services.backend.build.args.BUILD_COMMIT` interpolated from the host with an empty default; runtime `environment:` untouched.
- [B] .env.example: a commented `BUILD_COMMIT` entry under a new `# --- Build ---` heading explaining it is the build-time commit sha, read by `docker compose build`, and that unset means `"unknown"`.
- [B] backend/tests/unit/test_config_unit.py: tests for `build_commit` (set value returned stripped; unset yields `DEFAULT_BUILD_COMMIT == "unknown"`; blank and whitespace-only treated as unset; read per call, not at import).
- [B] backend/tests/unit/test_version_service_unit.py: tests for `get_build_commit()` (40 chars cut to first 12; exactly 12 unchanged; shorter unchanged; unset returns `"unknown"`; `BUILD_COMMIT_LENGTH == 12`).
- [B] backend/tests/integration/test_version_integration.py: update the two existing exact-body assertions to include `commit`; add set path (monkeypatched 40-char `BUILD_COMMIT` → 200, `commit` is its first 12), unset path (`delenv` → `"unknown"`), blank path (`"   "` → `"unknown"`), exact key set `{"version", "commit"}`, and the OpenAPI component `VersionResponse` listing both as required strings.
- [Docs] README.md: the repository-structure line for `.env.example` mentions the new `BUILD_COMMIT` build variable (run configuration changed).

`backend/app/main.py` is NOT modified: the version router is already registered by TEST-05. `docs/DEVELOPMENT.md` needs no edit: it documents no application environment variables (they live in `.env.example`), and this feature changes no tooling, dependency or test infrastructure. No dependency change, so no lockfile entry. No E2E spec file: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: config parsing of `BUILD_COMMIT` (set, unset, blank, per-call freshness); service `get_build_commit()` truncation boundaries (40, 12, shorter, unset); schema field set and required fields; router handler sourcing `commit` from the service. All with `monkeypatch` on the environment or the service function, no network or database.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_config_unit.py`, `test_version_service_unit.py`, new `test_version_unit.py`)
- Integration tests: full HTTP cycle through `TestClient` against `create_app()`: set and unset commit paths, blank value, exact key set, OpenAPI schema shape, existing 405 case kept. No database needed (the endpoint never touches it; the existing `DATABASE_URL`-unset test stays).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (existing `test_version_integration.py`)
  - Note: `get_settings()` is read per request, so `monkeypatch.setenv("BUILD_COMMIT", ...)` works with the session-scoped `client` fixture; no fresh app needed.
- E2E tests: none written. E2E is ENABLED, but no acceptance criterion requires navigation or interaction through the UI (backend-only item; the UI that shows the commit is TEST-10). `testing_standards.md` Section 5 also forbids an E2E test that calls the API directly.
  - Directory: e2e/tests/ (no file for this item)
  - File: n/a for this item, no spec is due
- UAT scenarios: one scenario per criterion plus the 40-character truncation edge case, phrased as API observations (request `GET /api/version`, read the JSON body).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` strings | Integration | Verifying it needs no navigation or interaction: it is a router response shape, asserted over a real HTTP cycle. |
| 2 | `commit` comes from `BUILD_COMMIT` (build-time), default `"unknown"`, first 12 chars, never a router literal | Unit + Integration | Verifying it needs no navigation or interaction: it is configuration parsing and service logic (unit), plus the set/unset value reaching the response (integration). |
| 3 | Body defined by a Pydantic schema in `backend/app/schemas/` | Unit + Integration | Verifying it needs no navigation or interaction: it is a schema definition, checked on the model and on the OpenAPI component. |
| 4 | Unit and integration tests cover set and unset commit paths | Unit + Integration | It is a statement about the tests themselves: satisfied by the set/unset tests in both tiers listed in the File Manifest, with no UI involved. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/version` returns 200 with `version` and `commit` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/version, Then the status is 200 and the body has string fields `version` and `commit` only |
| 2 | `commit` from `BUILD_COMMIT`, default `"unknown"`, first 12 chars | covered at Unit + Integration, see Criterion coverage | Given the backend image was built with BUILD_COMMIT set to a 40-character sha, When a client requests GET /api/version, Then `commit` equals the sha's first 12 characters; Given it was built without BUILD_COMMIT, Then `commit` is "unknown" |
| 3 | Body defined by a Pydantic schema | covered at Unit + Integration, see Criterion coverage | Given the API is running, When a client reads /openapi.json, Then the `VersionResponse` component requires `version` and `commit` as strings |
| 4 | Tests cover set and unset paths | covered at Unit + Integration, see Criterion coverage | Given the backend test suite, When it runs, Then the set-commit and unset-commit tests pass in the unit and integration tiers |

## Manual verification plan
This item has no UI (backend only; the footer that displays the commit is TEST-10), so every check below is an HTTP request read in a terminal. Run commands from the repository root.

### Criterion 1: `GET /api/version` returns 200 with `version` and `commit`
Prerequisites: Docker running; stack built and started with `docker compose up -d --build` (BUILD_COMMIT not exported in this shell).
1. Run `curl -s -i http://localhost:8010/api/version` → the status line reads `HTTP/1.1 200 OK` and `content-type: application/json`.
2. Read the body → exactly two keys, `version` and `commit`, both strings: `{"version": "0.1.0", "commit": "unknown"}` (version is `[project].version` in backend/pyproject.toml).
3. Run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/version` → prints `405`.

### Criterion 2: `commit` comes from the build-time BUILD_COMMIT, default "unknown", first 12 characters
Prerequisites: as for Criterion 1.
1. Run `unset BUILD_COMMIT`, then `docker compose build backend` and `docker compose up -d backend` → backend container restarts.
2. Run `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
3. Run `export BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` (40 characters), then `docker compose build backend` and `docker compose up -d backend`.
4. Run `curl -s http://localhost:8010/api/version` → `{"version": "0.1.0", "commit": "0123456789ab"}` (first 12 characters only).
5. Run `export BUILD_COMMIT=abc1234`, rebuild and restart as in step 3, then curl again → `commit` is `"abc1234"` (shorter values are unchanged).
6. Run `docker compose exec backend printenv BUILD_COMMIT` → prints `abc1234`, the value baked in at build time.
7. Open `backend/app/routers/version.py` → `commit` is passed as `get_build_commit()`; no sha or `"unknown"` literal appears in the router.
8. Run `unset BUILD_COMMIT`, rebuild and restart the backend to leave the stack in its default state.

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack running as for Criterion 1.
1. Open `backend/app/schemas/version.py` → `VersionResponse(BaseModel)` declares `version: str` and `commit: str`.
2. Open `http://localhost:8010/docs` in a browser and expand `GET /api/version` → the 200 response schema is `VersionResponse` with `version` and `commit`, both required strings.

### Criterion 4: unit and integration tests cover the set and unset commit paths
Prerequisites: uv installed; a database for the integration tier per CLAUDE.md Backing Services (the version tests themselves need none).
1. Run `uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/unit/test_version_unit.py` → all pass, including the build-commit set, unset and blank cases.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → all pass, including the 40-character set path (`commit` is 12 characters) and the unset path (`commit` is `"unknown"`).
3. Run `uv run --directory backend pytest -q -k build_commit` → collected count is greater than zero and every selected test passes.
