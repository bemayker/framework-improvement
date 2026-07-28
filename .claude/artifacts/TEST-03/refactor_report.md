# Refactor Gate report, TEST-03 (Simple note form)

- **Phase:** build-feature Phase F, Section 13 (`refactoring_standards.md`)
- **Branch:** `feature/TEST-03-simple-note-form`
- **Scope:** the 30 files this feature created or modified (per the Phase F handover manifest)
- **Toggle:** `Refactor Gate: ENABLED`
- **Passes:** 1 (the gate's single pass; Phase E's RECOMMENDED findings are mandatory input here and have no other fix round)

## Findings

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | backend/tests/unit/test_main_unit.py | No unit test asserts `/api/notes` is wired into the app factory; the plan's manifest entry for this file was never applied (Phase E RECOMMENDED 1) | Dead code / stale test | RECOMMENDED | Extend the route assertion to cover `/api/notes`, rename the test to match what it now asserts |
| 2 | backend/app/core/config.py:23-29, :41-48 | `_read_cors_origins` and `sqlalchemy_url` are branching pure functions with no direct unit test; the `postgresql://` → `postgresql+psycopg://` normalisation is load-bearing for the whole data layer (Phase E RECOMMENDED 2) | Excessive complexity (untested branches) | RECOMMENDED | Add `backend/tests/unit/test_config_unit.py` covering both functions' branches |
| 3 | frontend/src/components/NoteForm.tsx:109 | `maxLength={500}` duplicates the API contract's limit, which the backend owns as `MAX_NOTE_LENGTH` (`models/note.py:10`, reused in `schemas/note.py:25`) (Phase E RECOMMENDED 3) | DRY violations | RECOMMENDED | Export `MAX_NOTE_LENGTH` from `frontend/src/api/notes.ts` (the module that owns the contract) and reference it |
| 4 | frontend/src/vite-env.d.ts | `VITE_API_BASE_URL` is undeclared, so `vite/client`'s `[key: string]: any` index signature types `resolveBaseUrl()`'s lookup as `any`, against `coding_standards.md` Section 4 ("Do not use `any`") | Import hygiene | RECOMMENDED | Declare it on `ImportMetaEnv` via declaration merging so the lookup is `string \| undefined` |
| 5 | frontend/src/components/{NoteForm,NoteList,LandingPage,AppFooter}.tsx | Style-object duplication: `NoteList.emptyStyle` is byte-identical to `LandingPage.statusStyle`, `NoteForm.errorStyle` differs from `LandingPage.errorStyle` only in `textAlign`, and the `0.875rem` / `#5f5f5f` pair recurs in four components | DRY violations | OPTIONAL | Extract shared design tokens — **not applied**, see below |
| 6 | frontend/src/api/notes.ts:79-110 | `request()` nests a `try` inside a `try/finally` across three levels to separate transport failure, HTTP failure and body-parse failure | Excessive complexity | OPTIONAL | Split the transport call into its own helper — **not applied**, see below |
| 7 | backend/app/routers/notes.py:26, :32 | Both handlers call `NoteRead.model_validate(...)` explicitly although FastAPI would serialise the ORM objects from the return annotation anyway (`NoteRead` sets `from_attributes=True`) | Layered-architecture drift | OPTIONAL | Rely on the declared response type — **not applied**, see below |
| 8 | frontend/src/api/notes.ts:31 | `NotesApiError.status` is assigned on every throw but never read by any consumer (`useNotes` reads only `.message`) | Dead code | OPTIONAL | Drop the field — **not applied**, see below |
| 9 | frontend/src/components/NoteForm.test.tsx, e2e/tests/TEST-03_simple_note_form.spec.ts | The literal `"Note text is required"` appears in four test assertions, duplicating `NoteForm.LABELS.required` | DRY violations | OPTIONAL | Import the constant — **not applied**, see below |

## Applied in this pass (all RECOMMENDED)

1. **`backend/tests/unit/test_main_unit.py`** — `test_create_app_registers_version_route` renamed to `test_create_app_registers_feature_routes` and its assertion set extended with `/api/notes`. This closes the plan's `test_main_unit.py` manifest entry (`plan.md:121`) properly rather than recording it as dropped: the factory's router wiring is now unit-asserted for both feature routers, and the docstring no longer claims a TEST-05-only scope. The plan's stated *urgency* was indeed stale (TEST-05 had already removed the "no feature routes" assertion, so nothing was failing), but the coverage gap it named was real.
2. **`backend/tests/unit/test_config_unit.py`** (new, 8 tests) — direct coverage of both branching functions in `config.py`: the plain-scheme normalisation, an already-explicit `+psycopg` URL passing through unchanged, `None` when `DATABASE_URL` is unset, `get_settings()` re-reading the environment per call (the `default_factory` contract), and the CORS default / comma-split-and-trim / blank-entry-filtered / all-blank-falls-back cases. Naming follows `testing_standards.md` Section 3; the environment is patched per test via `monkeypatch`, so nothing leaks between tests or into the integration tier.
3. **`frontend/src/api/notes.ts` + `frontend/src/components/NoteForm.tsx`** — `MAX_NOTE_LENGTH = 500` is now exported from the API-client module (the frontend's owner of the API contract) with a comment naming `backend/app/models/note.py` as the mirror, and `NoteForm` imports it for `maxLength`. The literal `500` no longer appears in any frontend component.
4. **`frontend/src/vite-env.d.ts`** — declares `VITE_API_BASE_URL?: string` on `ImportMetaEnv`. Verified by a throwaway assignment that `tsc` now reports the lookup as `string | undefined` rather than `any`, so `resolveBaseUrl()` is type-checked; the probe file was removed and `tsc -b --force` is clean.

## Not applied, with reasons (all OPTIONAL, informational per `refactoring_standards.md` Section 4)

- **#5, shared style tokens.** No CSS framework is configured (`CLAUDE.md` Tech Stack lists React/TypeScript/Vite only), so "each component owns its inline `CSSProperties` objects" is the convention the scaffold established in `AppFooter.tsx` and every component since. Introducing a token module is a styling-architecture decision, not a behaviour-preserving cleanup, and it would touch four files to deduplicate three small literals — against KISS. Left for a deliberate styling pass if a utility framework is ever adopted.
- **#6, `request()` nesting.** The nesting is what distinguishes the three failure modes the API client must report differently, and the `finally` must outlive all of them to clear the abort timeout. Splitting it would trade local complexity for indirection with no readability gain.
- **#7, explicit `model_validate`.** Removing it would make the response shape depend on FastAPI's implicit ORM conversion instead of an expression in the handler. That is a behaviour-adjacent change to the response path for zero quality gain — exactly what Section 5 rule 2 warns against.
- **#8, `NotesApiError.status`.** It is a documented public field of an exported error class, i.e. part of the client module's contract for callers that need to branch on the HTTP status. Removing it is a signature change (Section 5 rule 2), not dead-code removal.
- **#9, duplicated validation message in tests.** Deliberate: a test that imports the string it asserts cannot detect that string changing. Tests should assert the user-visible literal.

## Verification (`refactoring_standards.md` Section 5 rule 4)

| Suite | Command | Result |
| --- | --- | --- |
| Backend unit + integration | `cd backend && DATABASE_URL=… uv run pytest -q` | **35 passed**, 0 failed, 0 skipped (13 integration against real PostgreSQL, confirmed executed with `-v`) |
| Frontend unit | `cd frontend && npm test` | **23 passed** across 5 files, 0 failed |
| Frontend typecheck | `cd frontend && npx tsc -b --force` | clean (exit 0) |

The integration tier ran against the already-running `test03-gate-postgres` container on port 5442 (`docker compose up db` could not bind 5432, occupied by an unrelated container); credentials and database name are the Compose defaults, so the run is equivalent to the documented one.

No behavioural change was made: no new features, no API signature changes, no migrations, no cross-module boundary changes. Nothing needed reverting.

## Notes for the PR description

Phase E's three OPTIONAL findings are not in scope for this gate (`review_standards.md` Section 6.3) and belong under "Known improvements" in the PR, alongside items #5-#9 above.
