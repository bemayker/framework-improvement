# Refactor Gate report, TEST-03

Phase F of `/build-feature` (build-feature Section 13), one single pass, run after the Phase E
self-review. Branch `feature/TEST-03-simple-note-form`, commit `refactor(TEST-03): code quality cleanup`.

## 1. Findings and disposition

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | `backend/app/schemas/note.py` | **R2 (Phase E)** `NoteCreateRequest.text` has no upper bound, so any payload size is written verbatim into an unbounded `TEXT` column | Review finding (mandatory input) | RECOMMENDED | **Applied.** `text: str = Field(max_length=MAX_NOTE_TEXT_LENGTH)` with `MAX_NOTE_TEXT_LENGTH = 1000`, alongside the existing blank-rejecting `field_validator` |
| 2 | `backend/tests/unit/test_note_schemas_unit.py` | **R2 (Phase E)** the new bound needs at-limit and over-limit cases | Review finding (mandatory input) | RECOMMENDED | **Applied.** Two cases added: exactly `MAX_NOTE_TEXT_LENGTH` accepted, `+1` rejected |
| 3 | `backend/app/core/db.py` | **R3 (Phase E)** no unit test; `connect()` raising `RuntimeError` on unset `DATABASE_URL` (lines 32-36) and `get_connection` rolling back on an escaping exception (lines 47-54) are exercised nowhere | Review finding (mandatory input) | RECOMMENDED | **Applied, as a test only.** No production change: the verify command passed (Section 2). **Created** `backend/tests/unit/test_db_unit.py` |
| 4 | `frontend/src/api/notes.ts` | **R4 (Phase E)** lines 35-91 untested; `isNote`, the `ApiError` status mapping, the non-2xx branch, the invalid-JSON branch and the array-shape guard run in no tier because every consumer mocks the module | Review finding (mandatory input) | RECOMMENDED | **Applied, as a test only.** No production change: the verify command passed (Section 2). **Created** `frontend/src/api/notes.test.ts` |
| 5 | `frontend/src/components/NoteForm.tsx`, `frontend/src/components/LandingPage.tsx` | `errorStyle` (NoteForm lines 45-49) and `notesErrorStyle` (LandingPage lines 54-59) are near-duplicate inline style objects, differing only by `textAlign` | DRY violations | OPTIONAL | Not applied. The extraction has no existing home, and creating a shared styles module is outside this gate's mandate (`refactoring_standards.md` Section 3 permits a new file only to apply a review finding) |
| 6 | `frontend/src/api/notes.ts` | `INVALID_RESPONSE_MESSAGE` is thrown with `response.status` inside `requestJson` (line 65) but with `null` from the shape guards in `listNotes` (line 73) and `createNote` (line 87), so one message carries two different `status` values | Naming consistency | OPTIONAL | Not applied. Aligning them changes the observable `ApiError.status` of a public client method, which `refactoring_standards.md` Section 5 rules 1-2 forbid this gate from doing |

**No RECOMMENDED finding arose from the gate's own Section 3 checklist analysis.** The seven categories
were checked across all 27 files in `## Changed files so far`: no dead code or unused imports, no
function over ~50 LOC or with notable branching, no business logic in the router (`app/routers/notes.py`
delegates both endpoints straight to the service), no direct DB access outside
`app/repositories/note_repository.py`, no wildcard or circular imports, and one component per file with
names matching. The two findings above are the whole of it and both are OPTIONAL. All four applied
changes are Phase E's mandatory input.

## 2. `Verify by running:` discharges

Both findings carrying a verify line are runtime suspicions the read-only reviewer could not settle
(`review_standards.md` Section 6.1). Both commands were run **before** any change in this pass:

| Finding | Command | Result | Consequence |
| --- | --- | --- | --- |
| R3 | `cd backend && env -u DATABASE_URL uv run pytest tests/unit -q` | **20 passed, 0 failed** | Passed, so no production change to `app/core/db.py`. The unit tier genuinely needs no database; the gap R3 names is coverage, not a defect, and it is closed by the new test file |
| R4 | `cd frontend && npm test` | **25 passed, 0 failed** | Passed, so no production change to `frontend/src/api/notes.ts`. Same disposition: the gap is coverage, closed by the new test file |

## 3. Files created

Both are the one sanctioned case (`refactoring_standards.md` Section 3): a review finding that cannot be
applied without a new test file.

- `backend/tests/unit/test_db_unit.py` — 5 cases: `connect()` hands the configured URL to psycopg; raises
  on unset `DATABASE_URL`; raises on an empty-string `DATABASE_URL`; `get_connection` closes without
  rolling back on a clean request; rolls back **then** closes when the request raises (asserted as an
  ordered call list, since closing first would discard the open transaction without an explicit rollback).
  Stubs `psycopg.connect` and `db.connect`, so it runs in the unit tier with no database.
- `frontend/src/api/notes.test.ts` — 14 cases against a stubbed `fetch`: `listNotes` happy path and
  request URL, empty array, 500 with the status on the `ApiError`, network rejection with a `null` status,
  invalid JSON, a non-array body, and four malformed-element shapes through `isNote` (non-numeric `id`,
  missing `created_at`, `null`, a primitive); `createNote` happy path with the exact POST body and headers,
  a 422, a non-note response body, and a network rejection.

## 4. Behaviour change (deliberate, one)

The gate is behaviour-preserving (`refactoring_standards.md` Section 5) except where a mandatory
RECOMMENDED finding requires otherwise. R2 is that case: `POST /api/notes` now answers **422** for a
`text` longer than 1000 characters, where it previously accepted it. This is the change the finding asks
for. It touches no endpoint path, no response shape, no status code for any previously-valid input, and
no database schema. The bound is declared with `Field(max_length=...)` rather than checked after
stripping, so it surfaces as `maxLength` in the OpenAPI schema; it therefore measures the raw input, and
since `NoteForm` trims before calling `createNote`, the two measurements coincide for the real client.

## 5. Post-gate test results

| Tier | Command | Result |
| --- | --- | --- |
| Unit | `cd backend && env -u DATABASE_URL uv run pytest tests/unit -q` | **27 passed**, 0 failed, 0 skipped (was 20: +5 db, +2 schema) |
| Integration | `cd backend && DATABASE_URL=… uv run pytest tests/integration -q` | **13 passed**, 0 failed, 0 skipped (unchanged; real postgres:16 in `TEST-03-db`) |
| Frontend | `cd frontend && npm test` | **39 passed**, 0 failed, 0 skipped (was 25: +14 api client) |
| Type check | `cd frontend && npx tsc -b` | exit 0 |

No regressions, so no revert. The three `- tests:` lines are appended to
`.claude/artifacts/run/handover/TEST-03-run.md`.
