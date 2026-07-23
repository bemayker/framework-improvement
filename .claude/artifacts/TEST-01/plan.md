# Implementation Plan, TEST-01: Static landing page

## Feature
> The scaffold feature: create the initial project structure (React + TypeScript + Vite frontend, FastAPI backend managed with uv, Docker Compose with PostgreSQL, test infrastructure per CLAUDE.md Test Configuration) and serve a static landing page as the first visible output. Deliberately trivial; it exists to bootstrap the repo for the other sandbox features.

## Acceptance Criteria
- [ ] AC1: Visiting the app root (http://localhost:5173) shows a landing page with the app title "Task Notes".
- [ ] AC2: The project structure, test infrastructure, and Docker Compose setup are in place, and all test tiers run green (or as clean no-ops where no tests exist yet).

## Plan Overview
This is the **scaffold** item (`scaffold: true`). It bootstraps the whole repository and delivers one visible thing: a static React landing page whose header reads "Task Notes".

What gets built:
- **Frontend (the actual feature):** a Vite + React + TypeScript app whose landing page renders the "Task Notes" title. This is the only user-facing deliverable of TEST-01.
- **Backend skeleton:** a minimal FastAPI app (`create_app()`) managed with `uv`, wired so later features (TEST-02 health endpoint, TEST-03 notes CRUD) can add routers/services/repositories. TEST-01 adds **no endpoints and no business logic** (that would be gold-plating and would preempt TEST-02/03).
- **Infrastructure:** Docker Compose with PostgreSQL, the pytest/Vitest/Playwright test harness, and the UAT directory layout, exactly as named in `CLAUDE.md` Test Configuration.

The landing page is static and makes **no backend calls**, so AC1 is satisfied by the frontend alone. The backend and database exist only to establish the structure future features depend on. Per the architecture note ("keep every feature as small as possible") and `user_story_alignment.md`, no health check, no routing library, no note storage, and no CSS framework are introduced here.

## Infrastructure Scaffolding (scaffold feature only)
The following infrastructure is created alongside the feature.

### Project Structure
- `frontend/` — Vite + React + TypeScript application (source, config, Vitest unit tests colocated).
- `backend/` — FastAPI application managed with `uv`, plus `backend/tests/{unit,integration}/` and `backend/tests/conftest.py`.
- `e2e/` — Playwright TypeScript: `e2e/tests/` (specs), `e2e/helpers/` (shared helpers), `e2e/uat/scenarios/` and `e2e/uat/scripts/` (UAT artifacts).
- Repository root — `playwright.config.ts`, root `package.json` (Playwright runner), `docker-compose.yml`, `.env.example`.

### Docker Setup
- **`docker-compose.yml`** with two services:
  - `db` — `postgres:16-alpine`, named volume for persistence, healthcheck (`pg_isready`), env from `.env` / `.env.example` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`), port `5432`. Required by `CLAUDE.md` (PostgreSQL via Docker) and by the CI `Start services` step.
  - `backend` — built from `backend/Dockerfile`, depends on `db` (condition: service_healthy), exposes `8000`. Included so the stack is runnable end to end for the downstream features; it is **not** exercised by TEST-01's landing page or its E2E test.
- The **frontend is intentionally not containerized**: it runs via the Vite dev server (`npm run dev`) and Playwright launches it through its `webServer` config for E2E. This keeps the scaffold small; a frontend Dockerfile can be added later if a deployable image is needed.
- **`backend/Dockerfile`** — Python 3.12 slim base, install `uv`, `uv sync`, run `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- **`.env.example`** — documents `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`, and a composed `DATABASE_URL` for the backend (consumed by later features; present now so the compose/env contract is established). `.env` stays gitignored (already in `.gitignore`).

### Test Infrastructure
- **Backend (pytest via uv):** `backend/tests/conftest.py` provides a session-scoped `client` fixture (FastAPI `TestClient` built from `create_app()`) — the shared fixture named in `CLAUDE.md`. Directories `backend/tests/unit/` and `backend/tests/integration/` are created per `CLAUDE.md`. A single smoke unit test (`test_app_unit.py`) proves the pytest tier is wired and green. The integration tier is a **clean no-op** for TEST-01 (no repository/router/model code yet); it is kept green via `pytest` exit-code 5 handling (already implemented in `pr-tests.yml`) and the real DB-backed fixtures/tests land with TEST-02.
- **Frontend (Vitest):** `vitest` + `@testing-library/react` + `jsdom`, configured inside `frontend/vite.config.ts` with `frontend/src/setupTests.ts` for `jest-dom` matchers. One real unit test for the landing page component.
- **E2E (Playwright TS):** `playwright.config.ts` at repo root — `testDir: e2e/tests`, `baseURL: http://localhost:5173`, chromium project, `screenshot: 'only-on-failure'`, and a `webServer` block that runs `npm run dev` in `frontend/` and waits on `http://localhost:5173`. No hardcoded waits.
- **UAT layout:** `e2e/uat/scenarios/` (Gherkin) and `e2e/uat/scripts/` (manual scripts) created and populated for TEST-01. `e2e/uat/screenshots/` and `e2e/uat/reports/` remain gitignored and are not committed.

### CI Pipeline Configuration
> **Reality check / discrepancy with the task brief:** the brief stated CI files do **not** exist. In fact `/init-project` already materialized them: `.github/workflows/pr-tests.yml`, `.github/workflows/auto-done.yml`, and `.github/workflows/notify-slack.yml` are present and scaffold-safe. **The builder must NOT recreate them.** The plan is to *verify* they match the concrete commands the scaffold introduces, and edit only if they diverge.

Verification checklist for the builder (expected: no changes needed):
- `pr-tests.yml` installs backend with `cd backend && uv sync`, frontend with `cd frontend && npm ci || npm install`, and root Playwright deps — matches this layout. Backend unit/integration run `cd backend && uv run pytest tests/unit|tests/integration -q` with exit-5 treated as pass — matches the `test_{module}_unit.py` / `test_{module}_integration.py` layout and the no-op integration tier. Frontend runs `npm test` in `frontend/` (guarded on a ` test` script existing) — ensure `frontend/package.json` defines a `test` script (`vitest run`). E2E runs `npx playwright test` when `playwright.config.ts` and `e2e/tests/` exist — matches. `docker compose up -d` starts `db` (+`backend`).
- `auto-done.yml` flips the merged item's `docs/issues/{ID}.md` frontmatter to `status: done` by parsing the `feature/{ID}-{slug}` branch — compatible with `feature/TEST-01-static-landing-page`. No change.
- The only action item: confirm `frontend/package.json` exposes a `test` script named exactly `test` (so the `grep -q " test"` guard in `pr-tests.yml` fires) and that `vite.config.ts`/`playwright.config.ts` bind port 5173.

## Frontend Plan
- **Components to create:**
  - `frontend/src/components/LandingPage.tsx` — semantic landing page: `<main>` containing a `<header>` with an `<h1>` reading "Task Notes" and a short subtitle. `data-testid="landing-page"` on the root and `data-testid="landing-title"` on the heading. No interactivity (the note form is TEST-03).
  - `frontend/src/App.tsx` — renders `<LandingPage />`.
  - `frontend/src/main.tsx` — React 18 root, mounts `<App />` into `#root`.
- **Routes:** none. Single static page; no router library is introduced (no navigation in scope).
- **State management:** none. Static content only.
- **Styling:** `CLAUDE.md` configures **no** utility CSS framework, so a small `frontend/src/index.css` provides minimal, clean, responsive, mobile-first styling for the landing page (permitted by `coding_standards.md` §3.1 when no framework is configured). Semantic HTML and an accessible `<h1>`. No design reference (Design Reference mode: NONE) → clean, professional default UI.
- **i18n:** the title string "Task Notes" is user-facing copy; kept as a single centralized constant in the component to stay i18n-ready without adding an i18n library (out of scope).

## Backend Plan
Minimal, health-check-level skeleton only — justified by "keep every feature as small as possible" and by the fact that TEST-01 has no user story requiring backend behaviour. The Router → Service → Repository layering is **not** pre-created as empty folders (that would be speculative gold-plating); it is introduced by the first feature that needs persistence (TEST-02/TEST-03), which is the correct greenfield growth point.
- **Endpoints:** none. (`GET /api/health` belongs to TEST-02; `POST/GET /api/notes` to TEST-03. Adding any endpoint here would preempt those items.)
- **App entry:** `backend/app/main.py` exposes `create_app() -> FastAPI` returning a bare app titled "Task Notes API", and a module-level `app = create_app()` for `uvicorn app.main:app`. No CORS, no DB session wiring yet (added by the first feature that makes cross-origin/DB calls).
- **Service layer:** none in this feature.
- **Repository layer:** none in this feature.
- **Migrations:** none. The `db` service starts empty; the schema/migration approach is established by TEST-03 (first persistence feature).
- **Dependency management:** `backend/pyproject.toml` for `uv` — runtime deps `fastapi`, `uvicorn[standard]`; dev deps `pytest`, `httpx` (for `TestClient`). `[tool.pytest.ini_options]` sets `pythonpath = ["."]` so `app` imports cleanly when pytest runs from `backend/`.

## API Integration Plan
No external API integration. `CLAUDE.md` lists no API references, and the landing page consumes no third-party service.

## API Contract
No internal or external API is defined by TEST-01. The landing page is fully static and issues no HTTP requests. (The frontend↔backend contract begins with TEST-02/TEST-03.)

## File Manifest
### New files
**Repository root**
- `package.json`: root Node package for the Playwright E2E runner; `devDependency` `@playwright/test`; script `"test:e2e": "playwright test"`.
- `playwright.config.ts`: Playwright config — `testDir: 'e2e/tests'`, `use.baseURL: 'http://localhost:5173'`, chromium project, `screenshot: 'only-on-failure'`, `webServer` running `npm run dev` in `frontend/` on port 5173 with `reuseExistingServer: !process.env.CI`.
- `docker-compose.yml`: `db` (postgres:16-alpine, volume, healthcheck) and `backend` (build `./backend`, depends_on db healthy, port 8000).
- `.env.example`: PostgreSQL and `DATABASE_URL` variables (documented, non-secret placeholders).

**Frontend**
- `frontend/package.json`: React 18, `react-dom`; dev: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`; scripts `dev` (vite), `build`, `preview`, `test` (`vitest run`).
- `frontend/vite.config.ts`: React plugin; `server.port: 5173`, `server.strictPort: true`; Vitest `test` block (`environment: 'jsdom'`, `globals: true`, `setupFiles: './src/setupTests.ts'`).
- `frontend/tsconfig.json` and `frontend/tsconfig.node.json`: TypeScript config for the app and for Vite config tooling.
- `frontend/index.html`: HTML shell with `<title>Task Notes</title>` and `<div id="root">`.
- `frontend/src/main.tsx`: React root bootstrap.
- `frontend/src/App.tsx`: renders `<LandingPage />`.
- `frontend/src/components/LandingPage.tsx`: the landing page (title "Task Notes", `data-testid` attributes, semantic HTML).
- `frontend/src/components/LandingPage.test.tsx`: Vitest unit test — renders `LandingPage`, asserts "Task Notes" is present.
- `frontend/src/index.css`: minimal, mobile-first landing page styling.
- `frontend/src/setupTests.ts`: imports `@testing-library/jest-dom` for Vitest.
- `frontend/src/vite-env.d.ts`: Vite client type reference.

**Backend**
- `backend/pyproject.toml`: uv project (deps + pytest config as above).
- `backend/Dockerfile`: Python 3.12 slim, uv, `uv sync`, uvicorn entrypoint.
- `backend/app/__init__.py`: package marker.
- `backend/app/main.py`: `create_app()` + `app` (FastAPI, title "Task Notes API", no endpoints).
- `backend/tests/__init__.py`: package marker.
- `backend/tests/conftest.py`: session-scoped `client` fixture (FastAPI `TestClient`).
- `backend/tests/unit/__init__.py`: package marker.
- `backend/tests/unit/test_app_unit.py`: smoke unit test — `create_app()` returns a `FastAPI` instance titled "Task Notes API".
- `backend/tests/integration/.gitkeep`: keeps the (currently empty) integration tier directory tracked; no tests yet (clean no-op).

**E2E / UAT**
- `e2e/tests/TEST-01_static-landing-page.spec.ts`: Playwright spec — navigate to `/`, assert the landing title "Task Notes" is visible via `data-testid="landing-title"`.
- `e2e/helpers/.gitkeep`: keeps the helpers directory tracked (no shared helpers needed yet).
- `e2e/uat/scenarios/TEST-01_static-landing-page.feature`: Gherkin scenario(s) for the landing page.
- `e2e/uat/scripts/TEST-01_static-landing-page_uat_script.md`: manual UAT clickthrough with pass/fail checkboxes.

### Modified files
- None expected. `CLAUDE.md`, `.gitignore`, `README.md`, and the three `.github/workflows/*.yml` already exist and are correct for this stack; the builder verifies the workflows (see CI section) and edits only if a command genuinely diverges. Do **not** overwrite the README or the CI files.

## Testing Strategy
- **Unit tests:**
  - *Frontend (Vitest):* `LandingPage` renders and shows "Task Notes". Directory: colocated `frontend/src/components/`. Naming: `LandingPage.test.tsx`. Run via `npm test` (`vitest run`).
  - *Backend (pytest via uv):* one smoke test that `create_app()` returns a titled `FastAPI` app (proves the tier is green). Directory: `backend/tests/unit/`. Naming: `test_{module}_unit.py` → `test_app_unit.py`. Function naming per `testing_standards.md` §3. No further backend unit tests are warranted — TEST-01 adds no service/business logic.
- **Integration tests (ENABLED per CLAUDE.md, but not warranted here):** skipped for TEST-01 because it adds no repository, model, migration, or router code. Directory `backend/tests/integration/` is created as a clean no-op (`pytest` exit-5 handled in CI); real integration coverage + the DB container fixture arrive with TEST-02.
- **E2E tests (ENABLED):** one spec covering AC1 — load `http://localhost:5173` and assert the "Task Notes" title is visible. Directory: `e2e/tests/`. File: `TEST-01_static-landing-page.spec.ts`. Locator precedence: `data-testid` first. Screenshot on failure enabled.
- **UAT scenarios (ENABLED):** one Gherkin scenario per acceptance criterion plus one edge-case scenario, and a manual script. Directory: `e2e/uat/scenarios/` (`TEST-01_static-landing-page.feature`) and `e2e/uat/scripts/` (`TEST-01_static-landing-page_uat_script.md`). Gherkin describes observable outcomes only (no duplication of the E2E interaction assertions).

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Visiting `http://localhost:5173` shows a landing page with the title "Task Notes" | Playwright: `page.goto('/')`, expect `getByTestId('landing-title')` to be visible and to have text "Task Notes" | **Given** the app is running **When** I open http://localhost:5173 **Then** I see a landing page whose title reads "Task Notes" |
| 2 | Project structure, test infra, and Docker Compose are in place; all test tiers run green (or clean no-ops) | Verified by the CI pipeline itself: `docker compose up -d` starts Postgres; backend unit test passes; backend integration no-ops green (exit 5); Vitest passes; the E2E spec above passes | **Given** a fresh checkout **When** I run `docker compose up -d`, the backend/frontend test commands, and `npx playwright test` **Then** every tier reports success with no failures (empty tiers report as clean no-ops); *edge case*: **Given** no integration tests exist yet **Then** the backend integration run still reports success rather than failure |
