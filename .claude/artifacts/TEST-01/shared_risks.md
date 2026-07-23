# Shared Risk Analysis, TEST-01

## Files this feature will create
**Repository root**
- `package.json` (Playwright E2E runner)
- `playwright.config.ts`
- `docker-compose.yml`
- `.env.example`

**Frontend**
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/tsconfig.node.json`
- `frontend/index.html`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/LandingPage.tsx`
- `frontend/src/components/LandingPage.test.tsx`
- `frontend/src/index.css`
- `frontend/src/setupTests.ts`
- `frontend/src/vite-env.d.ts`

**Backend**
- `backend/pyproject.toml`
- `backend/Dockerfile`
- `backend/app/__init__.py`
- `backend/app/main.py`
- `backend/tests/__init__.py`
- `backend/tests/conftest.py`
- `backend/tests/unit/__init__.py`
- `backend/tests/unit/test_app_unit.py`
- `backend/tests/integration/.gitkeep`

**E2E / UAT**
- `e2e/tests/TEST-01_static-landing-page.spec.ts`
- `e2e/helpers/.gitkeep`
- `e2e/uat/scenarios/TEST-01_static-landing-page.feature`
- `e2e/uat/scripts/TEST-01_static-landing-page_uat_script.md`

## Existing files this feature will modify
- None expected. `CLAUDE.md`, `.gitignore`, `README.md`, and `.github/workflows/{pr-tests,auto-done,notify-slack}.yml` already exist and suit this stack. The builder only *verifies* the workflows against the concrete commands (see plan → CI Pipeline Configuration) and edits a workflow solely if a command genuinely diverges — no README or CI overwrite.

## Potential conflicts with other independent features
TEST-01 is the **scaffold** item. Every other item in the backlog (TEST-02, TEST-03) declares `depends_on: [TEST-01]`, so none can run concurrently with it — the dependency graph serializes them strictly after TEST-01 is Done. There is therefore **no independent feature that could modify these files concurrently with TEST-01**; it creates the repository from scratch on its own branch.

Forward-looking notes (not conflicts *with* TEST-01, but flags for the items it unblocks — TEST-02 and TEST-03 become ready simultaneously and are independent of each other):
- `backend/app/main.py` — created here with no routers. **Both** TEST-02 (health router) and TEST-03 (notes router) will modify it to register their routers. These two are independent and could run concurrently; they should be **serialized** to avoid a collision on this file. This matches the ⚠️ note already recorded in `feature_map.md` for TEST-02/TEST-03.
- `backend/tests/conftest.py` — created here with a `client` fixture only. TEST-02 will extend it with the real DB container / session fixtures for the integration tier; TEST-03 will likely reuse them. Concurrent edits by TEST-02 and TEST-03 to this file are another reason to serialize that pair.
- `docker-compose.yml` / `.env.example` — established here. TEST-02 (DB connectivity check) and TEST-03 (notes persistence) consume the `db` service and `DATABASE_URL` but are not expected to modify the compose file; if either needs to, serialize with the other.
- `frontend/src/components/LandingPage.tsx` — TEST-03 adds the note form to the landing page and will modify this component; TEST-02 does not touch the frontend, so no frontend collision is expected between them.
