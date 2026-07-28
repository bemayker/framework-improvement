# Shared Risk Analysis, TEST-02

## Files this feature will create
- `backend/app/routers/health.py`
- `backend/app/services/health_service.py`
- `backend/app/repositories/health_repository.py`
- `backend/app/schemas/health.py`
- `backend/tests/unit/test_health_service_unit.py`
- `backend/tests/unit/test_health_repository_unit.py`
- `backend/tests/integration/test_health_integration.py`
- `e2e/uat/scenarios/TEST-02_health_endpoint.feature`
- `e2e/uat/scripts/TEST-02_health_endpoint_uat_script.md`

## Existing files this feature will modify
- `backend/app/main.py`: one import plus one `app.include_router(health.router)` line inside `create_app()`.
- `backend/pyproject.toml`: add `psycopg[binary]>=3.2` to `[project].dependencies`.
- `backend/uv.lock`: regenerated for the new dependency.
- `backend/tests/unit/test_main_unit.py`: replace `test_create_app_registers_no_feature_routes` (which asserts the app has zero custom routes and becomes false the moment any feature router lands) with an assertion that `/api/health` is registered.
- `.github/workflows/pr-tests.yml`: add an `env:` block with `DATABASE_URL` to the "Backend integration tests" step so the integration tier reaches the Compose PostgreSQL instance.

## Potential conflicts with other independent features

Per `.claude/feature_map.md`, TEST-02, TEST-03 and TEST-04 all depend only on TEST-01 (done), so all three are independent of each other and may run concurrently. **TEST-03 is currently an open, unmerged PR**, so its surface is a live conflict source even though this worktree branches from `origin/main` and contains none of it.

### TEST-03 "Simple note form" — high overlap, serialize or expect a rebase
- `backend/app/main.py` may also be modified by **TEST-03** (independent, could run concurrently): both features register a router in `create_app()`. Textual conflict in the same function is likely, though trivial to resolve (two independent `include_router` lines).
- `backend/tests/unit/test_main_unit.py` may also be modified by **TEST-03**: it is the same route-registration assertion. Both features must edit it for the same reason, so both edits land in the same test body — a real conflict, not a cosmetic one.
- `backend/pyproject.toml` and `backend/uv.lock` may also be modified by **TEST-03**: TEST-02 adds `psycopg[binary]` for its connectivity probe; TEST-03 adds a SQLAlchemy engine/session layer, which needs SQLAlchemy plus a driver. The dependency lists conflict textually and `uv.lock` will need regenerating (`uv lock`) after either merge rather than hand-merging.
- `.github/workflows/pr-tests.yml` may also be modified by **TEST-03**: TEST-02 exports `DATABASE_URL` to the integration step, and TEST-03's database-backed tests need the same variable. Whichever merges second should find the export already present and keep one copy.
- **Semantic (not textual) overlap on the database layer.** TEST-03's open PR introduces `backend/app/core/db.py` (SQLAlchemy engine/session) and modifies `backend/app/core/config.py` and `backend/tests/conftest.py` (DB fixtures). TEST-02 deliberately creates **no** `db.py`, and reads `config.py` without changing it, and adds no fixture to `conftest.py` — so there is no file-level conflict on those three paths. What remains is duplication of intent: after TEST-03 merges, the repo has both a shared SQLAlchemy engine and TEST-02's standalone `psycopg` probe.
- **Merge-order consequence:**
  - *If TEST-02 merges first:* TEST-03 rebases and re-applies its `main.py` router registration, its `test_main_unit.py` route assertion, and its dependency additions on top of TEST-02's. Its own `db.py` / `config.py` / `conftest.py` changes apply cleanly. TEST-02's endpoint keeps working unchanged.
  - *If TEST-03 merges first:* TEST-02 rebases onto the merged `db.py`/`config.py`/`conftest.py`, re-applies the same four overlapping edits, and re-runs `uv lock`. TEST-02's `psycopg` probe still works and must **not** be rewritten onto the new engine inside this item — folding the probe onto the shared engine is a follow-up refactor once both are on `main` (`/refactor backend`), because doing it during a rebase would silently expand TEST-02's reviewed scope.
  - Either way the second PR needs a rebase and a re-run of the gates; neither ordering blocks the other. `feature_map.md` already flags the pair (`⚠️ both TEST-02 and TEST-03 touch the FastAPI app entry (router registration); serialize if run concurrently`) — in assisted mode that is dispatch advice: prefer building the two in sequence over building them in parallel.

### TEST-04 "Page footer with app version" — disjoint
- No shared files. TEST-04 modifies `frontend/src/components/LandingPage.tsx` and frontend-side files only; TEST-02 touches nothing under `frontend/`. Safe to run concurrently with TEST-02 (as it is being planned, in its own worktree). `feature_map.md` records the same conclusion.

### Framework-level, not feature-level
- `.claude/artifacts/TEST-02/` is written only by this item. No other item's artifacts are read or written by this plan.
