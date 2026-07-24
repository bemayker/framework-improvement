# Shared Risk Analysis, TEST-01

## Files this feature will create
Repo root:
- `docker-compose.yml`
- `.env.example`
- `package.json`
- `playwright.config.ts`

Frontend:
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/index.html`
- `frontend/src/main.tsx`, `frontend/src/App.tsx`
- `frontend/src/components/LandingPage.tsx`, `frontend/src/components/LandingPage.test.tsx`
- `frontend/src/setupTests.ts`
- `frontend/Dockerfile`

Backend:
- `backend/pyproject.toml`
- `backend/app/__init__.py`, `backend/app/main.py`
- `backend/app/core/__init__.py`, `backend/app/core/config.py`
- `backend/app/routers/__init__.py`, `backend/app/services/__init__.py`, `backend/app/repositories/__init__.py`, `backend/app/schemas/__init__.py`, `backend/app/models/__init__.py`
- `backend/tests/__init__.py`, `backend/tests/conftest.py`
- `backend/tests/unit/__init__.py`, `backend/tests/unit/test_main_unit.py`
- `backend/tests/integration/__init__.py`
- `backend/Dockerfile`

E2E / UAT:
- `e2e/tests/TEST-01_static_landing_page.spec.ts`
- `e2e/helpers/.gitkeep`
- `e2e/uat/scenarios/TEST-01_static_landing_page.feature`
- `e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md`

## Existing files this feature will modify
- `.gitignore`: add `node_modules/`, `frontend/dist/`, `e2e/uat/screenshots/`, `e2e/uat/reports/`, `.venv/` if not already present.
- `.github/workflows/pr-tests.yml`: no change expected (verified compatible); touch only if concrete uv/npm commands differ from what the workflow assumes.

## Potential conflicts with other independent features
**None.** TEST-01 is the scaffold item; both other sandbox items depend on it:

- **TEST-02 (Health endpoint)** — `depends_on: [TEST-01]`
- **TEST-03 (Simple note form)** — `depends_on: [TEST-01]`

Because both dependents require TEST-01 to be Done before they can start (`work_items.md` Section 7 readiness rule), **no feature can run concurrently with TEST-01**, so there is no concurrent file-modification conflict to serialize for this item. TEST-01 creates the shared scaffold once; the dependents extend it afterward.

For downstream awareness (not a TEST-01 conflict): once TEST-01 is merged, TEST-02 and TEST-03 become ready simultaneously and are otherwise independent, but `feature_map.md` flags that **both will modify the FastAPI app entry (`backend/app/main.py`) for router registration** — those two should be serialized when run concurrently. TEST-01 establishes `backend/app/main.py` as a bare app with no routes precisely so that each dependent adds its own router cleanly.
