# Refactor Gate report, TEST-03 (Simple note form)

Phase F, build-feature Section 13. One pass, after the Phase E self-review.
Standards applied: `refactoring_standards.md` (categories Section 3, severities Section 4, scope rules Section 5),
`coding_standards.md`, `user_story_alignment.md` Section 3, `testing_standards.md` Sections 1.1 and 3.

Scope: the files this feature created or modified (the Phase F handover manifest's `## Changed files so far`),
plus the three files Phase E's RECOMMENDED findings point at.

## Applied

| # | File | Finding | Category | Severity | Change made |
| - | ---- | ------- | -------- | -------- | ----------- |
| 1 | backend/app/schemas/note.py | `NoteCreate.content` had no length bound while the column is unbounded `Text` and `POST /api/notes` is unauthenticated, so one request could write an arbitrarily large row (Phase E RECOMMENDED 2) | Excessive complexity / missing bound | RECOMMENDED | `MAX_NOTE_LENGTH = 1000` constant and `content: str = Field(max_length=MAX_NOTE_LENGTH)`. Not mirrored into `NoteService`: the bound is a payload rule, and duplicating it into business logic would add a second place to keep in sync for no caller that needs it. The blank rule stays mirrored, unchanged. |
| 2 | backend/tests/unit/test_note_schemas_unit.py (new) | The schema's blank and length rules had no unit coverage; the new bound needs a boundary test | Test coverage | RECOMMENDED | 4 tests / 6 cases: trimmed happy path, blank rejection (3 parametrized), accepted at exactly the limit, rejected one character over. |
| 3 | frontend/src/api/notes.test.ts (new) | No test file existed for the API client, whose four error branches (unreachable API, non-2xx, malformed JSON, non-array payload) were untested because `LandingPage.test.tsx` mocks the whole module out (Phase E RECOMMENDED 3) | Test coverage | RECOMMENDED | 8 tests with `fetch` stubbed: both happy paths, all four error branches, the `NotesApiError.status` each carries (`null` for a network failure, the HTTP status otherwise), and the request shape (method, JSON body, headers). |
| 4 | frontend/src/components/NoteForm.tsx | `data-testid="note-validation-error"` doubled as the save-failure channel: `SAVE_FAILED_MESSAGE` was set into the same state, so a rejected input and a failed save shared one identifier that Phase G will write Gherkin against (Phase E RECOMMENDED 4) | File & component structure / test attributes (`coding_standards.md` Section 3.6) | RECOMMENDED | One `Feedback` state carrying a `kind` (`"validation" \| "save"`), rendered under `note-validation-error` and a new `note-save-error` respectively. The single-state shape preserves the existing invariant that at most one message is on screen. `note-validation-error` keeps its original meaning, so the four E2E specs that reference it are unaffected. |
| 5 | frontend/src/components/NoteForm.test.tsx | The save-failure test asserted the validation test id, which is what let the two conditions share one identifier unnoticed | Test coverage | RECOMMENDED | Failure test now asserts `note-save-error` **and** the absence of `note-validation-error`; a new test asserts the converse for a rejected input. So the split cannot silently regress. |
| 6 | frontend/src/api/notes.ts | `requestJson` set `Content-Type: application/json` on every request, including the bodyless `GET /api/notes` (Phase E OPTIONAL, applied) | Dead code (a header describing a body that does not exist) | RECOMMENDED (regraded from Phase E OPTIONAL: one line, no signature change) | The header is attached only when `init.body` is set. Beyond tidiness this removes a CORS preflight: the `GET` is now a simple request instead of a preflighted one. Verified on the wire, see Evidence. |

## Not applied (recorded, not dropped)

| # | File | Finding | Category | Severity | Why not applied |
| - | ---- | ------- | -------- | -------- | --------------- |
| 7 | backend/app/core/db.py | The transactional boundary lives in the request dependency `get_session()` rather than in `NoteService` (`coding_standards.md` Section 2.2 point 2). Phase E OPTIONAL | Layered-architecture drift | OPTIONAL | Moving it is an architectural restructure above a level-1 gate change, and the current placement is a recorded plan decision (it keeps the service's only collaborator the repository Protocol, which is what makes it unit-testable without a database). Goes to the PR description as a known deviation. |
| 8 | backend/tests/conftest.py | `DEFAULT_TEST_DATABASE_URL` hardcodes a localhost connection string. Phase E OPTIONAL | Anti-pattern (`testing_standards.md` Section 5) | OPTIONAL | Sanctioned by plan decision 6: it is the documented fallback matching the compose service CI starts, and `DATABASE_URL` overrides it (which is how this run reached the TEST-03 container on port 55000). Changing it would break the CI integration step. |
| 9 | frontend/src/components/NoteForm.tsx | `rowStyle` repeats `formStyle`'s `flexDirection: "column"` and `gap: "0.5rem"`, so the wrapper `<div>` adds a DOM level with no layout effect | DRY violations | OPTIONAL | Removing the wrapper changes the DOM that the E2E and (soon) UAT specs traverse for no functional or visual gain. Not worth the churn inside a gate whose contract is behaviour preservation. |
| 10 | frontend/src/components/NoteForm.tsx, frontend/src/components/LandingPage.tsx | `errorStyle` and `loadErrorStyle` are identical three-property objects | DRY violations | OPTIONAL | Extracting a shared style module for three declarations would introduce a module the codebase's colocated inline-`CSSProperties` convention does not have. Local duplication is the cheaper, more consistent choice here. |
| 11 | backend/app/routers/notes.py | `NoteResponse.model_validate(note)` is redundant next to `response_model=NoteResponse` | Excessive complexity | OPTIONAL | Removing it would trade an explicit conversion for FastAPI's implicit one and make the handler's return type a lie. Clarity wins; no change. |
| 12 | backend/tests/conftest.py | `override_get_session` duplicates the commit/rollback logic of `app.core.db.get_session` | DRY violations | OPTIONAL | Deliberate and documented in the fixture docstring: the override must not reach for the process-wide engine, which reusing the real dependency would. |

Sweep with no findings: naming conventions (all seven files' classes, functions and constants match `coding_standards.md` Section 2.1), dead code and unused imports, import hygiene (no wildcard or cross-internal imports; the one function-scoped import in `db.create_all` is a documented circular-import break), placeholders (no `TODO`/`FIXME`, no `print()`/`console.log()` anywhere in `backend/app`, `frontend/src`, `e2e/tests`), and function size (no function over ~25 LOC).

## Evidence (run, not predicted)

Two of the changes above alter what goes over the wire, so both were executed against the real backend and the run's PostgreSQL container rather than reasoned about:

- **The length bound at the HTTP boundary.** `uvicorn app.main:app` on 127.0.0.1:8041 against the TEST-03 container: `POST /api/notes` with 1001 characters returned **422**, with 12 characters returned **201**. So the bound produces the FastAPI/Pydantic 422 shape the plan's API Contract already documents for invalid content, not a 500.
- **The removed `Content-Type` on the bodyless GET.** Same process: `GET /api/notes` with `Origin: http://localhost:5183` and **no** `Content-Type` returned `200` with `access-control-allow-origin: http://localhost:5183` and `vary: Origin`. The GET is now a simple cross-origin request and still passes CORS, so dropping the header cannot break the browser client. The rows the check created were deleted afterwards; the container was left running.

## Contract delta for the PR description

Finding 1 narrows the accepted input set: a `content` longer than 1000 characters now returns `422` where it previously returned `201`. That is a deliberate hardening of an unauthenticated write endpoint, applied because a Phase E RECOMMENDED finding has no fix round after this gate (`refactoring_standards.md` Section 2), and it is called out here because it is *not* behaviour-preserving in the strict sense of Section 5 rule 2. Nothing else changed observably: no endpoint path, no response shape, no other status code, no schema migration. The frontend was deliberately **not** given a matching `maxLength` on the input (that would be an unrequested UI behaviour change, `user_story_alignment.md` Section 3); an over-long note therefore surfaces as the save-failure message, which finding 4 has just given its own test id.

## Test results after refactoring (`refactoring_standards.md` Section 5 rule 4)

| Tier | Command | Result |
| --- | --- | --- |
| Frontend (Vitest) | `cd frontend && npm test` | 28 passed, 0 failed (was 19; +8 API client, +1 NoteForm). `npx tsc -b` clean. |
| Backend unit | `cd backend && env -u DATABASE_URL uv run pytest tests/unit -q` | 24 passed, 0 failed (was 18; +6 schema cases) |
| Backend integration | `cd backend && DATABASE_URL=…@localhost:55000/tasknotes uv run pytest tests/integration -q` | 12 passed, 0 failed (unchanged) |

No revert was needed.
