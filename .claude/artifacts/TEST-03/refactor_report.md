# Refactor Report: TEST-03 (build-feature Phase F, Section 13)

Scope: all files created or modified by TEST-03 (see `.claude/artifacts/run/handover/TEST-03-F.md` file list). Analysed against `refactoring_standards.md` Section 3 checklist; Phase E's RECOMMENDED review finding merged in as mandatory input per Section 13 step 4.

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | `backend/app/core/config.py` lines 39, 43 (was 39, 43, 52-53) | `Settings.database_url` / `Settings.cors_origins` used a bare `os.environ.get(...)` expression as the dataclass field default, which Python evaluates once at class-definition (import) time, not per `Settings()` construction — contradicting `get_settings()`'s "read fresh from the environment" docstring. Carried over verbatim from Phase E self-review (RECOMMENDED, mandatory input). | Excessive complexity / correctness trap (semantic, not the standard's naming/DRY buckets, but the described defect) | RECOMMENDED | Changed both fields to `field(default_factory=lambda: os.environ.get(...))` / `field(default_factory=lambda: _parse_cors_origins(...))`, so each `Settings()` call re-reads the environment. |
| 2 | `backend/app/main.py` line 30 (pre-fix) | `import logging` was placed locally inside `_lifespan`'s `else` branch, inconsistent with `app/core/db.py` and `app/services/note_service.py`, both of which import `logging` at module scope and bind a module-level `logger`. Flagged OPTIONAL by Phase E; on independent analysis this is a straightforward, low-risk import-hygiene fix (checklist category 6), so it was promoted to RECOMMENDED and applied. | Import hygiene | RECOMMENDED | Moved `import logging` to the top of `app/main.py` alongside the other stdlib/framework imports; removed the local import. Behaviour unchanged (still only calls `logging.getLogger(__name__).warning(...)` on the same branch). |
| 3 | `frontend/src/vite-env.d.ts` | New file, absent from the plan's File Manifest. On analysis this is a necessary Vite ambient-types declaration (typing `import.meta.env.VITE_API_BASE_URL`, consumed by `frontend/src/api/notes.ts`), not gold-plating — TypeScript would not compile the `import.meta.env` access without it. | File & component structure | OPTIONAL | No change. Declined: the file is required for the existing code to type-check; nothing to remove or restructure. |
| 4 | `backend/app/schemas/note.py` | `NoteCreate.text` carries only `max_length=500`, not the plan's `min_length=1`; blank/whitespace-only rejection is centralised in `NoteService.create_note` instead, per the module's own docstring, so both empty-string and whitespace-only input produce the same `{"detail": "..."}` shape from one place. | Layered-architecture drift (business-rule placement) | OPTIONAL | No change. Declined: this is a documented, deliberate design decision (see the file's module docstring) that keeps blank-text rejection in one layer rather than splitting it across schema validation and service logic; it is not a defect and re-adding `min_length=1` would reintroduce the two-error-shape problem the comment explains. |

## Phase E RECOMMENDED finding — disposition

Applied in full (row 1 above): `backend/app/core/config.py`'s `database_url` and `cors_origins` fields now use `field(default_factory=...)` instead of a bare `os.environ.get(...)` default expression, so the environment is re-read on every `Settings()` construction, matching `get_settings()`'s documented "read fresh from the environment" contract.

## Phase E OPTIONAL findings — disposition

- `frontend/src/vite-env.d.ts`: reviewed, no change (row 3) — necessary, not gold-plating.
- `backend/app/schemas/note.py` `min_length`: reviewed, no change (row 4) — deliberate, already documented design choice.
- `backend/app/main.py` `import logging` placement: promoted to RECOMMENDED and applied (row 2), rather than left OPTIONAL, since it fell out as a straightforward, low-risk import-hygiene fix under the Section 13 step 3 classification.

## Additional own-analysis findings

None beyond the above. The remaining changed files (`backend/app/models/note.py`, `backend/app/repositories/note_repository.py`, `backend/app/routers/notes.py`, `backend/app/services/note_service.py`, `backend/app/core/exceptions.py`, `backend/app/core/db.py`, `frontend/src/components/*.tsx`, `frontend/src/hooks/useNotes.ts`, `frontend/src/api/notes.ts`, and the test files) were reviewed against all seven checklist categories (naming, DRY, dead code, complexity, layered-architecture drift, import hygiene, file/component structure) and showed no findings: layering is clean (Router → Service → Repository, no SQLAlchemy outside the repository, no business logic in the router), no duplicate logic warranting extraction, no dead code or unused imports, no oversized functions, and one component/hook per file matching its filename.

## Behavioural constraints (Section 5)

No new features, no API signature changes, no database migrations, no cross-module boundary changes. Both applied changes are internal to their existing files/modules.

## Test re-run (Section 13 step 6)

- Backend: `cd backend && DATABASE_URL="postgresql://tasknotes:tasknotes@localhost:5442/tasknotes" uv run pytest -q` → **15 passed**.
- Frontend: `cd frontend && npm test` → **13 passed** (4 test files).

No regressions; the refactoring commit stands (no revert needed).
