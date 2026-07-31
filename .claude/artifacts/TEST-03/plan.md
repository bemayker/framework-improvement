# Implementation Plan, TEST-03: Simple note form

## Feature
> Add a minimal note form to the landing page: a text input and a submit button that stores the note via the backend in PostgreSQL and shows the saved notes in a list. Deliberately trivial; exercises the fullstack slice (frontend, API, database) of the framework lifecycle.

## Acceptance Criteria
- [ ] Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload.
- [ ] Submitting an empty note is rejected with a visible validation message and no API call.
- [ ] Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL).

## Plan Overview
A full vertical slice: a `notes` table in PostgreSQL, a Router → Service → Repository backend stack exposing `POST /api/notes` and `GET /api/notes` (per `coding_standards.md` Section 2.2), and a note form plus note list on the existing landing page that call the backend through a dedicated API client module. TEST-03 also introduces the project's first real database connectivity (the code comments in `backend/app/core/config.py` and `backend/tests/conftest.py` assigned that to TEST-02, but TEST-02 has not merged and TEST-03 depends only on TEST-01, so this feature carries its own DB layer): the `psycopg` driver, a per-request connection dependency, startup schema creation, and the shared real-database test fixture that `coding_standards.md` Section 2.5 requires.

Documented assumptions (per `user_story_alignment.md` Section 2):
- A whitespace-only note counts as empty: the frontend trims before validating, and the backend strips and rejects blank text with 422, so the two layers agree.
- The list shows notes oldest-first (ascending `id`), matching insertion order. No pagination, sorting, editing, or deleting: none is in the criteria (`user_story_alignment.md` Section 3).
- No custom `AppException` hierarchy is introduced: the feature's only domain error case (blank note) is handled by schema validation, which FastAPI already answers with a machine-readable 422 JSON body, so there is no exception with nowhere to go. Unexpected DB errors are logged with context and surface as 500.
- App startup runs schema creation only when `DATABASE_URL` is set; without it the app still starts (unit tests and the bare TestClient need no database) and DB-backed routes fail loudly with a logged 500.
- The integration tests and the E2E run require the docker-compose `db` service (or an equivalent PostgreSQL reachable via `DATABASE_URL`); this is documented in `docs/DEVELOPMENT.md` rather than provisioned by test code.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/NoteForm.tsx` (new, molecule): a `<form>` with a labelled text input (`data-testid="note-form-input"`), a submit button (`data-testid="note-form-submit"`), and a validation message element (`data-testid="note-form-error"`, rendered with `role="alert"` when the trimmed input is empty on submit). On invalid submit it sets the message and makes no API call; on valid submit it calls the `onSubmit` prop with the trimmed text and clears the input on success. UI text strings live in named constants, ready for i18n (`coding_standards.md` Section 3.3).
  - `frontend/src/components/NoteList.tsx` (new, molecule): renders the saved notes as a semantic `<ul>` (`data-testid="note-list"`), one `<li>` per note (`data-testid="note-list-item-{id}"`). Renders an empty-state text (`data-testid="note-list-empty"`) when there are no notes.
  - `frontend/src/components/LandingPage.tsx` (modified): keeps the existing heading, subtitle, and `AppFooter` untouched; adds the notes section inside `<main>`. Owns the notes state: `useState<Note[]>` plus a `useEffect` that loads notes via the API client on mount, and an append handler that POSTs then updates state, so a new note appears without a page reload. Shows a fetch/submit error line (`data-testid="notes-error"`) when an API call fails.
  - `frontend/src/api/notes.ts` (new): dedicated API client module (`coding_standards.md` Section 4 client-layer rule applied to our own backend): typed `Note` DTO, `listNotes(): Promise<Note[]>` and `createNote(text: string): Promise<Note>` using native `fetch` against `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"` (docker-compose already supplies `VITE_API_BASE_URL`). Non-2xx responses and network errors throw a typed error the component turns into the visible error line. No `any`.
- Routes: none, the app stays a single landing page.
- State management: local component state via `useState`/`useEffect` in `LandingPage` (native state APIs first, `coding_standards.md` Section 3.3). No context or state library.
- Design reference notes: AI freestyle (Design Reference mode NONE). Match the existing inline-`CSSProperties` styling convention already used by `LandingPage.tsx` and `AppFooter.tsx`; keep the form usable on a mobile viewport (stacked layout, full-width input).

## Backend Plan
- Endpoints:
  - `POST /api/notes`: create a note. 201 with the created note on success; 422 (FastAPI validation error) when `text` is missing, empty, or blank after stripping.
  - `GET /api/notes`: list all notes ascending by `id`. 200 with a JSON array (empty array when none exist).
- Service layer: `backend/app/services/note_service.py` with `create_note(conn, text) -> Note` and `list_notes(conn) -> list[Note]`. Business logic is deliberately thin (the validation lives in the schema layer); the service owns the transactional boundary: `create_note` commits the connection after a successful insert (`coding_standards.md` Section 2.2).
- Repository layer: `backend/app/repositories/note_repository.py` with `insert_note(conn, text) -> Note` and `select_notes(conn) -> list[Note]`, plain parameterized SQL via `psycopg` (`INSERT ... RETURNING id, text, created_at` and `SELECT ... ORDER BY id ASC`). Returns `Note` domain dataclasses from `backend/app/models/note.py` (id, text, created_at), kept separate from the response schemas.
- Connection handling: `backend/app/core/db.py` provides `get_connection()`, a FastAPI dependency that opens a `psycopg` connection from `settings.database_url`, yields it, rolls back on error, and closes it; and `ensure_schema(conn)` executing `CREATE TABLE IF NOT EXISTS notes (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, text TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`. `backend/app/main.py` gains a lifespan handler that runs `ensure_schema` at startup when `DATABASE_URL` is set, registers the notes router, and adds Starlette's `CORSMiddleware` for the frontend origin (the Vite dev server on 5173 calls the API on 8000 cross-origin; origin configured via `backend/app/core/config.py`, default `http://localhost:5173`). Errors are logged via the `logging` module, matching `version_service.py`; no `print()`.
- Schemas: `backend/app/schemas/note.py` with `NoteCreateRequest` (`text: str`, stripped, `min_length=1` after strip via a field validator) and `NoteResponse` (`id`, `text`, `created_at`), Pydantic models separate from the domain model.
- Migrations: no migration tool. The schema change is the single `CREATE TABLE IF NOT EXISTS` statement above, executed at app startup and by the integration-test fixture (see Technology Selection).

## API Integration Plan
No external API integration.

## API Contract
- Method: POST
- URL: `/api/notes`
- Request: `{"text": "Buy milk"}` (JSON body; `text` required, non-blank after stripping)
- Response: 201

  ```json
  {"id": 1, "text": "Buy milk", "created_at": "2026-07-31T09:15:00+00:00"}
  ```

  422 with FastAPI's standard validation-error JSON body when `text` is missing, empty, or whitespace-only.

- Method: GET
- URL: `/api/notes`
- Request: no parameters
- Response: 200

  ```json
  [{"id": 1, "text": "Buy milk", "created_at": "2026-07-31T09:15:00+00:00"}]
  ```

  Empty array `[]` when no notes exist. Notes are ordered ascending by `id`.

## Technology Selection
- PostgreSQL access: no stdlib module, native platform feature, or installed dependency speaks to PostgreSQL (stdlib `sqlite3` cannot satisfy the PostgreSQL criterion), so one new dependency is required; chose `psycopg` (v3, plain parameterized SQL in the repository) over SQLAlchemy plus a driver, because one table with two queries needs no ORM and SQLAlchemy would be a second new dependency on top of a driver.
- Schema creation: chose a `CREATE TABLE IF NOT EXISTS` statement at app startup and in the test fixture (a few lines through the driver above) over adding Alembic as a migration dependency.
- Backend request validation: chose Pydantic constrained fields plus a strip validator (Pydantic is already installed with FastAPI) over hand-rolled request checks in the router.
- CORS for the 5173 → 8000 call: chose Starlette's `CORSMiddleware` (already installed with FastAPI) over adding a Vite dev-server proxy; both are zero-dependency, but the middleware behaves identically under docker compose and bare-metal dev, where a proxy target would have to differ per environment.
- Frontend HTTP: chose native `fetch` over adding axios or another HTTP client.
- Notes state: chose React `useState`/`useEffect` (already installed) over adding a data-fetching or state-management library.
- Client-side empty check: chose a few lines of component state in `NoteForm` over adding a form library; the native `required` attribute was considered (the native-feature rung) but rejected because it does not catch whitespace-only input, so the trim rule would need script anyway, and its browser-native bubble is not a DOM element the E2E and UAT criterion "visible validation message" can target via `data-testid`.

## File Manifest

### New files
- [B] backend/app/core/db.py: psycopg connection dependency (`get_connection`) and `ensure_schema` (CREATE TABLE IF NOT EXISTS notes)
- [B] backend/app/models/note.py: `Note` domain dataclass (id, text, created_at)
- [B] backend/app/schemas/note.py: `NoteCreateRequest` (stripped, non-blank) and `NoteResponse` Pydantic schemas
- [B] backend/app/repositories/note_repository.py: `insert_note` and `select_notes`, parameterized SQL returning `Note` dataclasses
- [B] backend/app/services/note_service.py: `create_note` (transactional boundary, commit) and `list_notes`
- [B] backend/app/routers/notes.py: `POST /api/notes` (201) and `GET /api/notes` (200), no business logic
- [B] backend/tests/unit/test_note_service_unit.py: service unit tests with a mocked repository (happy path, empty list edge case, DB-error case)
- [B] backend/tests/unit/test_note_schemas_unit.py: schema validation unit tests (valid text, stripped text, empty/whitespace-only rejected, missing field)
- [B] backend/tests/integration/test_notes_integration.py: repository round-trip against real PostgreSQL, router POST 201 / GET 200 / POST 422 through the HTTP cycle
- [A] frontend/src/api/notes.ts: typed API client module (`Note` DTO, `listNotes`, `createNote`) using fetch and `VITE_API_BASE_URL`
- [A] frontend/src/components/NoteForm.tsx: note input, submit button, and client-side validation message
- [A] frontend/src/components/NoteForm.test.tsx: Vitest tests for submit-with-text, empty/whitespace rejection with visible message and no callback, input clearing
- [A] frontend/src/components/NoteList.tsx: semantic list of saved notes with empty state
- [A] frontend/src/components/NoteList.test.tsx: Vitest tests for rendering notes, empty state, testid stability
- [D] e2e/tests/TEST-03_simple_note_form.spec.ts: Playwright specs covering all three acceptance criteria plus the whitespace-only edge case
- [G] e2e/uat/scenarios/TEST-03_simple_note_form.feature: Gherkin scenarios, one per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md: manual UAT clickthrough script with pass/fail checkboxes
- [G] .claude/artifacts/TEST-03/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/pyproject.toml: add the `psycopg` dependency
- [B] backend/uv.lock: lockfile regenerated by the dependency change above
- [B] backend/app/main.py: register the notes router, add `CORSMiddleware`, add the lifespan schema-creation hook
- [B] backend/app/core/config.py: add the CORS allowed-origin setting; retire the stale "unused until TEST-02" comment on `database_url`
- [B] backend/tests/conftest.py: add the shared real-database fixture (connect via `DATABASE_URL`, run `ensure_schema`, truncate `notes` between tests) alongside the existing client fixture
- [A] frontend/src/components/LandingPage.tsx: add the notes section (NoteForm + NoteList), notes state, load-on-mount and append-on-create handlers
- [A] frontend/src/components/LandingPage.test.tsx: extend with notes-section tests, mocking the `api/notes` client module
- [Docs] README.md: note that the backend now uses the PostgreSQL `db` service at runtime (notes persistence) in the running-the-project section
- [Docs] docs/DEVELOPMENT.md: document that backend integration tests and the E2E suite need the `db` service (or a reachable `DATABASE_URL`) running

## Testing Strategy
- Unit tests: `note_service` with the repository mocked (create happy path, list empty edge case, propagated DB error case) and `note` schemas (valid, stripped, empty, whitespace-only, missing field). Frontend: Vitest component tests for `NoteForm` (valid submit, empty and whitespace-only rejection with visible message and no API callback), `NoteList` (items, empty state), and `LandingPage` (loads and appends notes with the API module mocked).
  - Directory: backend/tests/unit/ (frontend tests colocated per the existing `*.test.tsx` convention)
  - Naming: test_{module}_unit.py
- Integration tests: repository insert + select round-trip against real PostgreSQL (including empty result set), router `POST /api/notes` 201, `GET /api/notes` 200, and `POST` 422 for blank text through the full HTTP cycle. Isolation via `TRUNCATE notes` between tests; shared fixtures in backend/tests/conftest.py.
  - Directory: backend/tests/integration/
- E2E tests: submit a note and assert it appears in the list without navigation; submit empty and whitespace-only input and assert the validation message shows and no `POST /api/notes` request fires (asserted via Playwright request interception); reload the page and assert the note is still listed. Locators use `data-testid` first per `testing_standards.md` Section 1.3.
  - Directory: e2e/tests/
  - File: TEST-03_simple_note_form.spec.ts
- UAT scenarios: one Gherkin scenario per acceptance criterion plus a whitespace-only edge-case scenario, and a manual clickthrough script.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload | Fill `note-form-input`, click `note-form-submit`, assert the text appears in `note-list` while the page URL never navigates; assert a 201 `POST /api/notes` fired | Given the landing page is open, When I type "Buy milk" and press Save, Then "Buy milk" appears in the notes list without the page reloading |
| 2 | Submitting an empty note is rejected with a visible validation message and no API call | Click submit with the input empty (and again with only spaces), assert `note-form-error` is visible and Playwright request interception recorded no `POST /api/notes` | Given the landing page is open, When I press Save with an empty input, Then a validation message is shown and no note is added |
| 3 | Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL) | Create a note, `page.reload()`, assert the note is still rendered in `note-list` (served by `GET /api/notes`) | Given I saved the note "Buy milk", When I reload the page, Then "Buy milk" is still shown in the notes list |
