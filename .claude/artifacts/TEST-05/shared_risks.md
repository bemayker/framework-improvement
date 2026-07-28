# Shared Risk Analysis, TEST-05

Branch: `feature/TEST-05-version-endpoint`, cut from `origin/main`. At the time of planning, `origin/main` contains the TEST-01 scaffold only — neither TEST-02's nor TEST-03's work is in it, and both are open, unmerged PRs. This plan is written against the code as it stands in this worktree.

## Files this feature will create

- `backend/app/routers/version.py`
- `backend/app/services/version_service.py`
- `backend/app/schemas/version.py`
- `backend/tests/unit/test_version_service_unit.py`
- `backend/tests/integration/test_version_integration.py`

All five are new paths unique to TEST-05; no other open or planned item in the backlog claims any of these filenames.

## Existing files this feature will modify

- `backend/app/main.py`: adds `from app.routers.version import router as version_router` and one `app.include_router(version_router)` line inside `create_app()`, plus one docstring line. No restructuring of the factory.
- `backend/tests/unit/test_main_unit.py`: replaces `test_create_app_registers_no_feature_routes` (which asserts the app exposes **no** custom routes) with `test_create_app_registers_version_route`. The other two tests in the file are untouched.

Deliberately not modified: `backend/pyproject.toml`, `backend/uv.lock`, `backend/tests/conftest.py`, `backend/app/core/config.py`, `.github/workflows/*`, and everything under `frontend/` and `e2e/`.

## Potential conflicts with other independent features

TEST-02, TEST-03, TEST-04 and TEST-05 are all independent of one another (each depends only on TEST-01, which is done), so any of them can be in flight concurrently.

### Textual conflict — high likelihood, two files, shared with TEST-02 and TEST-03

- `backend/app/main.py` **will also be modified by TEST-02** (PR #6, registers the `/api/health` router) **and by TEST-03** (PR #5, registers the `/api/notes` router). All three add an import at the top of the file and an `include_router(...)` call in the same spot inside `create_app()`. Expect a git conflict in both hunks whenever a second of the three merges without the branch first being updated from `main`. The resolution is always additive — keep every import and every `include_router` line, drop nothing — but it will not auto-merge.
- `backend/tests/unit/test_main_unit.py` **will also be modified by TEST-02 and TEST-03**, for the same reason and with a sharper consequence: `test_create_app_registers_no_feature_routes` asserts the custom-route set is **empty**, so it goes red the moment *any* feature router lands. Each of the three branches must rewrite that one test, and each rewrites it to assert its own route.

**Merge-order consequence (the risk to act on).** Whichever of TEST-02, TEST-03, TEST-05 merges first turns the other two branches stale in a way CI on those branches will not have caught: their copy of `test_main_unit.py` was written against the pre-merge assertion and, once rebased, will assert only their own route while `main` now expects the earlier one too. So:

1. Do not merge two of these three PRs back to back without updating the second one's branch from `main` and re-running CI. A green check on a stale branch is not evidence here.
2. On rebase or merge-from-main, resolve `test_main_unit.py` by asserting the **union** of the routes actually registered (e.g. `/api/version` and `/api/health` both present), not by keeping one side's version of the test.
3. Prefer serializing the merges of TEST-02, TEST-03 and TEST-05 over merging them in parallel. Building them concurrently is fine and intended; it is the merge step that needs the queue.

### No conflict — TEST-04

- TEST-04 (page footer with app version, PR-to-be on `feature/TEST-04-page-footer`) touches only `frontend/` and `e2e/`, and reads its version from `frontend/package.json`. TEST-05 touches only `backend/` and reads `backend/pyproject.toml`. The two file sets are disjoint, which is the reason both items exist; they can be built and merged concurrently in either order with no interaction. The only overlap is conceptual (both surface "a version"), and no shared code, constant, or fixture is involved.

### Semantic coupling — low risk, worth knowing

- `backend/tests/conftest.py`: TEST-05 **consumes** the session-scoped `client` fixture without editing the file, while TEST-02 is expected to **edit** it (adding the database engine/session and migration fixtures its 503 criterion needs). No textual conflict, but if TEST-02 makes the `client` fixture require a live PostgreSQL, TEST-05's integration tests inherit that requirement and would no longer demonstrate criterion 3 (answers with `DATABASE_URL` unset) through that fixture. Mitigation, already in the plan: `test_version_answers_when_database_url_is_unset` builds its own client from a fresh `create_app()` rather than relying on the shared fixture, so the criterion stays provable whatever TEST-02 does to `conftest.py`.
- `backend/tests/integration/`: TEST-05 adds the first test file to this directory; TEST-02 and TEST-03 will add their own (`test_health_integration.py`, `test_notes_integration.py`). Different filenames, no conflict. `.github/workflows/pr-tests.yml` already runs `backend/tests/integration` when the directory exists, so no CI change is needed by any of them.
