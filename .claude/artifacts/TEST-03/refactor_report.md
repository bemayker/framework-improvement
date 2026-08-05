# Refactor gate report, TEST-03

- **Run:** `build-feature-20260804T232717Z`, Phase F (build-feature Section 13), single pass after the Phase E self-review.
- **Branch:** `feature/TEST-03-simple-note-form`
- **Scope:** the files this feature created or modified (the handover manifest's `## Changed files so far`), analysed against `refactoring_standards.md` Section 3, plus Phase E's three RECOMMENDED findings as mandatory input (Section 2, `review_standards.md` Section 6.3).
- **Mode:** greenfield, so `coding_standards.md` applies as written rather than diff-scoped.

## 1. Phase E RECOMMENDED findings (mandatory input, this pass is their only fix opportunity)

| # | File | Finding | Category | Severity | Proposed change | Outcome |
| - | ---- | ------- | -------- | -------- | --------------- | ------- |
| R1 | `frontend/src/api/notes.ts` | Never executed by any test: `NoteForm.test.tsx:6` and `LandingPage.test.tsx:7` both `vi.mock("../api/notes")`, so `listNotes`, `createNote` and both non-OK throw branches never ran | Test coverage (review finding) | RECOMMENDED | Test stubbing `global.fetch` rather than the module — **created `frontend/src/api/notes.test.ts`** | **Applied** |
| R2 | `backend/app/core/db.py` | No test of any tier: the unset-`DATABASE_URL` `RuntimeError`, the rollback-on-exception path, and `ensure_schema`'s `str \| Connection` dispatch all unexercised | Test coverage (review finding) | RECOMMENDED | Unit test with `psycopg.connect` stubbed — **created `backend/tests/unit/test_db_unit.py`** | **Applied** |
| R3 | `backend/app/schemas/note.py`, `frontend/src/components/NoteForm.tsx`, `backend/tests/integration/test_notes_integration.py` | `NoteCreate.text` has `min_length=1` but no `max_length`; the column is `TEXT` with only a `btrim` CHECK and the input set no `maxLength`, so unbounded text was accepted and stored | Input validation (review finding) | RECOMMENDED | `NOTE_TEXT_MAX_LENGTH = 500` in the request schema, mirrored as the input's `maxLength`, with both boundary cases in the integration tier | **Applied** |

R1 and R2 are the one sanctioned reason this gate creates files (`refactoring_standards.md` Section 3): a "there is no test for X" finding cannot be applied without one. Both created files are named above and in the return payload, and Phase H re-checks them.

**R3 is the one change in this commit that is not behaviour-preserving**, and it is deliberate. Section 5 rules 1-2 forbid new behaviour and API-contract changes for the gate's *own* analysis; R3 is Section 2's mandatory review input, whose whole point is that a 501-character body used to be stored and must now be rejected. Concretely: `POST /api/notes` with text longer than 500 characters now returns 422 instead of 201, and the input stops accepting keystrokes at 500. No database migration was made (Section 5 rule 3): the `notes.text` column stays `TEXT` with its existing `btrim` CHECK, so the bound lives in the request contract only. The 500 figure is the reviewer's suggestion, kept as-is: a task note is one line, and nothing in the acceptance criteria argues for a different bound.

## 2. Gate's own analysis (Section 3 checklist)

| # | File | Finding | Category | Severity | Proposed change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | `backend/app/routers/notes.py` | `NoteResponse(id=note.id, text=note.text)` is written twice (lines 36, 43) | DRY violations | OPTIONAL | Could become `NoteResponse.model_validate(note)` behind `from_attributes=True`. Not applied: a two-field mapping repeated twice does not justify making response construction implicit, and the explicit form is the more readable of the two |
| 2 | `frontend/src/components/NoteForm.tsx`, `NoteList.tsx`, `LandingPage.tsx` | The inline `CSSProperties` objects repeat the same border-radius, padding and font idioms across three components | DRY violations | OPTIONAL | A shared style/token module. Not applied: the extraction requires a **new** file, which Section 3 places outside this gate's mandate for its own findings, and the project declares no CSS framework to centralise into. Left as a finding for a later feature |
| 3 | `backend/app/services/note_service.py` | `create_note` and `list_notes` share the same try / `logger.exception` / re-raise shape | DRY violations | OPTIONAL | A logging decorator. Not applied: it would replace four obvious lines per function with indirection, against `coding_standards.md` Section 1 (KISS, "wary of hasty abstractions") |
| 4 | `frontend/src/components/LandingPage.test.tsx` | Repeats the `fireEvent.change` + `fireEvent.click` pair that `NoteForm.test.tsx` wraps in `typeNote`/`submitForm` | DRY violations | OPTIONAL | Shared test helper. Not applied: sharing it needs a new helper file, and one duplicated interaction in one spec is below that bar |

Checked and clean, no finding raised: **naming consistency** (Python `snake_case` functions with `PascalCase` classes and `UPPER_SNAKE_CASE` constants; TypeScript `camelCase` with `PascalCase` components), **dead code** (no unused import, variable, unreachable branch or commented-out block in any changed file), **excessive complexity** (no function over ~50 LOC, no nesting past two levels, no long parameter lists), **layered-architecture drift** (router holds no business logic, all SQL is in `NoteRepository`, the service owns the trimming rule, `api/notes.ts` holds no UI logic), **import hygiene** (no wildcard or circular imports; the one cross-package import, `from tests.conftest import require_database_url`, is the deliberate target of that guard's regression test), **file and component structure** (one component per file, filenames matching).

**No RECOMMENDED finding came out of the gate's own analysis, so nothing beyond R1-R3 was changed.** That is the reported outcome, not an omission: manufacturing churn to make the gate look busy is what Section 5 exists to prevent.

## 3. Test results after the gate

| Tier | Command | Result |
| --- | --- | --- |
| Unit | `cd backend && env -u DATABASE_URL uv run pytest tests/unit -q` | 21 passed (16 prior + 5 new in `test_db_unit.py`) |
| Integration | `cd backend && DATABASE_URL=…@localhost:55004/tasknotes uv run pytest tests/integration -q` | 16 passed (14 prior + 2 new length-boundary cases) |
| Frontend | `cd frontend && npm test` | 26 passed (20 prior + 6 new in `src/api/notes.test.ts`) |
| Typecheck | `cd frontend && npx tsc -b` | exit 0 |
| Full backend suite | `cd backend && DATABASE_URL=…@localhost:55004/tasknotes uv run pytest -q` | 37 passed |

No revert was needed (Section 5 rule 4). The tiers ran against the run's recorded `TEST-03-db` on host port 55004; nothing was provisioned and nothing torn down. The `require_database_url` CI guard added in the Phase E fix round is untouched and its four regression tests are inside the 21 above.

## 4. Files created by this gate

- `frontend/src/api/notes.test.ts` (R1)
- `backend/tests/unit/test_db_unit.py` (R2)
