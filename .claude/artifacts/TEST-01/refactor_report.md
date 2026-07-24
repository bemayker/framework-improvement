# Refactor Report: TEST-01 Static landing page

Analysis of all files created/modified by this feature against `refactoring_standards.md`.

## Findings

| # | File | Finding | Category | Severity | Proposed Change | Status |
| - | ---- | ------- | -------- | -------- | --------------- | ------ |
| 1 | `backend/app/core/config.py` | `database_url` fell back to a hardcoded, credential-shaped connection string (`postgresql://tasknotes:tasknotes@localhost:5432/tasknotes`) when `DATABASE_URL` was unset. Carried over from Phase E self-review (BLOCKING/RECOMMENDED input, mandatory for this gate). | Naming/security hygiene (no category maps exactly; treated as a security-adjacent code-quality fix) | RECOMMENDED | Read `DATABASE_URL` from the environment with no baked-in credential default; default to `None` with a short "dev-only, unused until TEST-02" comment. `docker-compose.yml` and `.env.example` already supply the real value at runtime, so no other file needed a change. | **Applied** |
| 2 | `backend/Dockerfile` | The first `COPY` stage (dependency layer, used for Docker layer caching) copied only `pyproject.toml`, not the committed `uv.lock`, before `uv sync --no-install-project`. Without the lock file present at that point, the dependency layer could re-resolve versions instead of installing the exact locked set, undermining both reproducibility and the caching benefit the two-stage COPY pattern exists for. Raised as an OPTIONAL finding in Phase E self-review. | Layered-architecture / build hygiene | Judged **RECOMMENDED-grade** on inspection: low risk (Docker COPY line + one flag), clear correctness improvement, `uv lock --check` confirms `uv.lock` is in sync with `pyproject.toml` | Copy `uv.lock` alongside `pyproject.toml` in the first `COPY`, and add `--frozen` to `uv sync` so the dependency layer installs exactly the locked versions. | **Applied** |

## Declined / Not Applicable

None. Both findings carried into this gate (the mandatory Phase E RECOMMENDED finding, and the OPTIONAL Dockerfile finding judged RECOMMENDED-grade here) were applied.

## Scope Rules Compliance

- No new features added.
- No API signature changes (no endpoints exist yet in this feature).
- No database migrations.
- No cross-module boundary changes — both fixes stayed within `backend/app/core/config.py` and `backend/Dockerfile`.

## Test Re-run After Refactoring

- `cd backend && uv run pytest -q` → 3 passed.
- `cd backend && uv run pytest tests/integration -q` → clean no-op (exit 0, no tests collected), as expected for the scaffold feature.
- `cd frontend && npm test` → 3 passed (`LandingPage.test.tsx`).
- `cd backend && uv lock --check` → `uv.lock` confirmed in sync with `pyproject.toml` (no re-resolution needed), supporting the `--frozen` Dockerfile change.

No regressions. Refactoring commit retained.
