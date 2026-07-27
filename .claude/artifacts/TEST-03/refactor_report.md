# Refactor Gate Report: TEST-03 (branch feature/TEST-03-simple-note-form)

## Scope analysed

All files created or modified by this feature, per `.claude/artifacts/TEST-03/review_scope.md` plus commit `f0252a1` (`fix(TEST-03): address self-review findings`, which added `backend/tests/conftest.py` changes and `backend/tests/integration/test_db_session_isolation_integration.py`).

## Phase E input

Phase E (self-review) reported `recommended=0`. There is no mandatory RECOMMENDED input to merge into this pass. Phase E's three findings were all OPTIONAL:

1. Duplicated `errorStyle` `CSSProperties` object between `NoteForm.tsx` and `NotesSection.tsx`.
2. Two separate SQLAlchemy engines constructed against the same Postgres instance (`app/core/db.py`'s `get_engine()` vs `conftest.py`'s `db_engine` fixture).
3. A narrow `navigationCount` reset race in the E2E spec (`e2e/tests/TEST-03_simple_note_form.spec.ts`).

Per `review_standards.md` Section 6.3 / the refactor gate instructions, these OPTIONAL findings are not mine to fix in this pass — they go in the PR description. Re-assessed independently below rather than treated as pre-authorised.

## Findings

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | `frontend/src/api/notesApi.ts` | `fetchNotes()` and `createNote()` each repeated the identical fetch-try/catch (network error) + non-2xx check block, differing only in the `fetch` call itself | DRY violations | RECOMMENDED | Extracted a shared `requestJson<T>(path, init)` helper that does the fetch, network-error mapping, and non-2xx handling once; both exports now call it |
| 2 | `frontend/src/components/NoteForm.tsx` / `NotesSection.tsx` | Near-duplicate `errorStyle` `CSSProperties` objects (`fontSize` differs: `0.875rem` vs `0.9rem`) | DRY violations | OPTIONAL | Not applied — re-assessed independently (not just carried over from Phase E): the two objects aren't actually identical, are used for two different message contexts (inline field error vs section-level fetch error), and the codebase has no established shared-styles module yet (`coding_standards.md` §3.1 — inline `CSSProperties` per component is the current convention). Extracting a shared token for 3 near-identical lines is a subjective style call, not a clear low-risk win. |
| 3 | `backend/app/core/db.py` / `backend/tests/conftest.py` | Two separate SQLAlchemy engines are built against the same Postgres instance (production `get_engine()` singleton vs the test suite's module-scoped `db_engine` fixture) | DRY violations | OPTIONAL | Not applied — re-assessed independently: the fixture intentionally does not reuse `get_engine()` because it needs its own explicit lifecycle (module-scoped, disposed at suite end) independent of the app's lazy process-wide singleton, and `conftest.py`'s own docstring documents that the exact `join_transaction_mode` binding here is load-bearing for test isolation. Consolidating the two would increase coupling between test infrastructure and app internals for a 1-line `create_engine(...)` saving — not a favourable risk/reward trade. |
| 4 | `e2e/tests/TEST-03_simple_note_form.spec.ts` | `navigationCount` is reset to 0 immediately after `page.goto('/')` rather than measured from a point guaranteed to be after the initial load's `framenavigated` event, leaving a narrow window where a same-tick reset could race the event | Excessive complexity (test robustness) | OPTIONAL | Not applied — this is a standalone Playwright spec, not backend/frontend application code; genuinely fixing the race (e.g. awaiting a `load` event before resetting the counter) is a test-behaviour change best evaluated together with the rest of the E2E suite's conventions, not a mechanical, obviously-safe edit for this pass. Left for the PR description. |
| 5 | `backend/tests/conftest.py` / `backend/tests/integration/test_db_session_isolation_integration.py` | `test_note_committed_via_db_session_does_not_survive_fixture_teardown` re-implements the `db_session` fixture's connect/begin/bind/commit/rollback sequence inline rather than reusing the fixture | DRY violations | OPTIONAL | Not applied — this duplication is deliberate and documented: the test's own docstring explains it must replay the sequence independently because "a single test cannot observe" the fixture's own teardown having already run. Extracting a shared helper here would remove the property the test exists to verify. |

No other naming, dead-code, complexity, layered-architecture, import-hygiene, or file-structure issues were found. `npx tsc -b` (with `noUnusedLocals`/`noUnusedParameters` enabled) passes clean on the frontend with no dead code; a manual import-by-import check of every new/modified backend file found no unused imports (no `ruff` binary is installed in this environment to cross-check automatically).

## Applied

- **Finding #1** — extracted `requestJson<T>()` in `frontend/src/api/notesApi.ts`. No behaviour change: same endpoints, same HTTP methods, same headers/body, same error-message text and the same non-2xx / network-error mapping. `fetchNotes` and `createNote` keep their existing exported signatures, so no caller (`NotesSection.tsx`, or any test) needed a change.

## Verification

- `cd frontend && npx tsc -b` — clean, no errors.
- `cd frontend && npm test` — 15/15 passed (4 test files), unchanged from before the refactor.
- `cd backend && uv run pytest -q` (against a real PostgreSQL instance) — 20/20 passed, unchanged from before the refactor.

No regressions. Commit: `refactor(TEST-03): code quality cleanup`.
