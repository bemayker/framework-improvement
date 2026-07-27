# Implementation Plan, TEST-01: Static landing page

## Feature
> The scaffold feature: create the initial project structure (React + TypeScript + Vite frontend, FastAPI backend managed with uv, Docker Compose with PostgreSQL, test infrastructure per CLAUDE.md Test Configuration) and serve a static landing page as the first visible output. Deliberately trivial; it exists to bootstrap the repo for the other sandbox features.

## Acceptance Criteria
- [ ] Visiting the app root (http://localhost:5173) shows a landing page with the app title "Task Notes".
- [ ] The project structure, test infrastructure, and Docker Compose setup are in place, and all test tiers run green (or as clean no-ops where no tests exist yet).

## Re-Plan Feedback
This is a fresh re-plan (Section 3.1): draft PR #2 exists with **zero review comments**, so there is no feedback to fold in. The plan below is regenerated from scratch and supersedes the prior version.

## Plan Overview
TEST-01 is the **scaffold item** and no project directories exist yet (only an untracked pytest cache under `backend/`). The build therefore stands up the full project skeleton — Vite/React/TS frontend, FastAPI/uv backend with the Router → Service → Repository layout as empty-but-present packages, Docker Compose with PostgreSQL, and the test infrastructure (Vitest, pytest unit/integration dirs + shared conftest, Playwright E2E) — and delivers exactly one piece of visible behaviour: a static landing page rendering the title "Task Notes".

Scope is held tight (`user_story_alignment.md`, CLAUDE.md "keep every feature as small as possible"): **no backend feature endpoints** are added (health is TEST-02, notes CRUD is TEST-03), and **no DB engine/session wiring** is created beyond a config that reads `DATABASE_URL` — the actual connectivity check lands with TEST-02. The layered backend packages are created empty so TEST-02/TEST-03 extend them without restructuring. Integration tests are a clean no-op for this item (no repository/router yet); they become warranted at TEST-02.

## Infrastructure Scaffolding (scaffold feature)
Project directories do not exist yet, so this plan creates them.

### Project Structure
- `frontend/` — Vite + React + TypeScript app (source under `frontend/src/`).
- `backend/` — FastAPI app under `backend/app/` with layered packages: `routers/`, `services/`, `repositories/`, `schemas/`, `models/`, `core/` (all present, mostly empty at this stage to establish the pattern).
- `backend/tests/unit/`, `backend/tests/integration/` — pytest tiers with a shared `backend/tests/conftest.py`.
- `e2e/tests/`, `e2e/helpers/`, plus the UAT tree `e2e/uat/scenarios/`, `e2e/uat/scripts/` (screenshots/reports dirs are gitignored, created at runtime).

### Docker Setup
- `backend/Dockerfile` — Python 3.12 image, `uv sync`, runs uvicorn.
- `frontend/Dockerfile` — Node 20 image, Vite dev server on 5173.
- `docker-compose.yml` at repo root with services: `db` (postgres:16, named volume), `backend` (depends_on db, exposes 8000), `frontend` (exposes 5173). Env wired from `.env`.
- `.env.example` with `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and the frontend `VITE_API_BASE_URL` placeholder.

### Test Infrastructure
- Backend: `backend/tests/conftest.py` with a session-scoped FastAPI `TestClient` fixture and documented placeholders for a module-scoped DB fixture + migration runner (wired in TEST-02 when the DB layer arrives). Unit dir `backend/tests/unit/`, integration dir `backend/tests/integration/` (naming `test_{module}_unit.py` / `test_{module}_integration.py`).
- Frontend: Vitest + Testing Library configured in `frontend/vite.config.ts` (jsdom environment, `frontend/src/setupTests.ts`), `test` script in `frontend/package.json`.
- E2E: `playwright.config.ts` at repo root, `baseURL` http://localhost:5173, specs in `e2e/tests/`, screenshot-on-failure, chromium.
- Root `package.json` carrying the Playwright dev dependency and an `e2e` script.

### CI Pipeline Configuration
`/init-project` already generated `.github/workflows/pr-tests.yml`. Verified against this plan: it installs `backend` (uv), `frontend` (npm), and root E2E deps; starts `docker-compose.yml`; runs `backend/tests/unit`, `backend/tests/integration` (pytest exit-5 treated as pass), frontend Vitest, and Playwright when `e2e/tests` exists. All paths and commands match this scaffold — **no changes to the workflow are required.**

## Frontend Plan
- Components to create:
  - `frontend/src/main.tsx` — React entry, mounts `<App/>`.
  - `frontend/src/App.tsx` — top-level app shell.
  - `frontend/src/components/LandingPage.tsx` — the landing page: semantic `<header>`/`<main>` with an `<h1>` reading "Task Notes" and a short subtitle. `data-testid="landing-page"` on the container and `data-testid="landing-title"` on the heading. Clean, professional default styling (Design Reference is NONE — AI freestyle, minimal plain CSS; no CSS framework is configured in CLAUDE.md).
- Routes: none; single static page at `/`.
- State management: none (static content).
- Design reference notes: NONE mode → simple centered title + subtitle, accessible landmarks, mobile-first. No external fonts/icons.

## Backend Plan
- Endpoints: **none added by TEST-01.** The FastAPI app is instantiated (title "Task Notes API") so TEST-02/TEST-03 can register routers on it; no feature routes are created here (scope containment).
- Service layer: none yet — `backend/app/services/` created as an empty package.
- Repository layer: none yet — `backend/app/repositories/` created as an empty package.
- Config: `backend/app/core/config.py` — a settings object reading `DATABASE_URL` and app metadata from the environment (used by later features; no DB connection opened here).
- Migrations: none. DB engine/session wiring is deferred to TEST-02.

## API Integration Plan
No external API integration.

## API Contract
No internal or external API endpoints are introduced by TEST-01. The frontend renders a fully static page and makes no network calls. (The internal REST contract begins at TEST-02 `GET /api/health` and TEST-03 `/api/notes`.)

## File Manifest
### New files
**Repo root**
- `docker-compose.yml`: db (postgres:16) + backend + frontend services.
- `.env.example`: env var template (DB + VITE_API_BASE_URL).
- `package.json`: root, Playwright dev dependency + `e2e` script.
- `playwright.config.ts`: Playwright config, baseURL 5173, specs in `e2e/tests/`.

**Frontend**
- `frontend/package.json`: React, TS, Vite, Vitest, Testing Library; `dev`/`build`/`test` scripts.
- `frontend/vite.config.ts`: Vite + Vitest (jsdom) config.
- `frontend/tsconfig.json`, `frontend/tsconfig.node.json`: TS config.
- `frontend/index.html`: Vite HTML entry.
- `frontend/src/main.tsx`: React entry point.
- `frontend/src/App.tsx`: app shell rendering `LandingPage`.
- `frontend/src/components/LandingPage.tsx`: landing page with "Task Notes" title + test ids.
- `frontend/src/components/LandingPage.test.tsx`: Vitest render test.
- `frontend/src/setupTests.ts`: Testing Library / jsdom setup.
- `frontend/Dockerfile`: frontend container.

**Backend**
- `backend/pyproject.toml`: FastAPI, uvicorn, pytest, httpx (managed with uv).
- `backend/app/__init__.py`
- `backend/app/main.py`: FastAPI app factory (title "Task Notes API"), no feature routes.
- `backend/app/core/__init__.py`, `backend/app/core/config.py`: settings reading `DATABASE_URL`.
- `backend/app/routers/__init__.py`, `backend/app/services/__init__.py`, `backend/app/repositories/__init__.py`, `backend/app/schemas/__init__.py`, `backend/app/models/__init__.py`: empty layered packages.
- `backend/tests/__init__.py`, `backend/tests/conftest.py`: shared fixtures (TestClient; DB fixture placeholder documented for TEST-02).
- `backend/tests/unit/__init__.py`, `backend/tests/unit/test_main_unit.py`: asserts the app instantiates with the expected title.
- `backend/tests/integration/__init__.py`: present, no tests yet (clean no-op).
- `backend/Dockerfile`: backend container.

**E2E / UAT**
- `e2e/tests/TEST-01_static_landing_page.spec.ts`: landing page shows "Task Notes".
- `e2e/helpers/.gitkeep`
- `e2e/uat/scenarios/TEST-01_static_landing_page.feature`: Gherkin (UAT ENABLED).
- `e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md`: manual UAT script.

### Modified files
- `.github/workflows/pr-tests.yml`: no change required (verified above); modify only if the concrete uv/npm commands differ from what the workflow assumes.
- `.gitignore`: add `node_modules/`, `frontend/dist/`, `e2e/uat/screenshots/`, `e2e/uat/reports/`, `.venv/` entries if not already covered.

## Testing Strategy
- Unit tests: backend — assert the FastAPI app instantiates with title "Task Notes API" (happy path); the scaffold has no service/business logic yet, so the single instantiation test is the warranted unit coverage. Frontend — Vitest render test that `LandingPage` shows "Task Notes".
  - Directory: `backend/tests/unit/` (naming `test_{module}_unit.py`); frontend colocated `*.test.tsx`.
- Integration tests: **clean no-op for TEST-01** — no repository or router exists yet, so `backend/tests/integration/` is present but empty (pytest exit-5 = pass). Warranted starting TEST-02. (Integration Tests ENABLED per CLAUDE.md.)
  - Directory: `backend/tests/integration/`.
- E2E tests: one spec verifying the landing page renders the "Task Notes" title at the root URL (E2E ENABLED).
  - Directory: `e2e/tests/`
  - File: `TEST-01_static_landing_page.spec.ts`
- UAT scenarios: one Gherkin scenario + manual script for the landing-page title (UAT ENABLED).
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Root shows landing page with title "Task Notes" | Navigate to `/`; assert `getByTestId('landing-title')` (role heading) has text "Task Notes" | Given the app is running, When I open http://localhost:5173, Then I see the title "Task Notes" |
| 2 | Structure, test infra, Docker Compose in place; all tiers green/no-op | Covered by the pipeline: Vitest + pytest unit run green, integration no-ops cleanly, `docker compose up` starts db/backend/frontend, and the E2E spec above passes | Given the repo is checked out, When I run `docker compose up` and the test suites, Then services start and all tiers pass or no-op cleanly |
