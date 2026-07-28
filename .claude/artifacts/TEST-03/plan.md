# Implementation Plan, TEST-03: Simple note form

## Feature
> Add a minimal note form to the landing page: a text input and a submit button that stores the note via the backend in PostgreSQL and shows the saved notes in a list. Deliberately trivial; exercises the fullstack slice (frontend, API, database) of the framework lifecycle.

## Acceptance Criteria
- [ ] Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload.
- [ ] Submitting an empty note is rejected with a visible validation message and no API call.
- [ ] Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL).

## Plan Overview

A minimal fullstack slice: a `Notes` React component (text input + submit button + saved-notes list) rendered on the existing landing page, backed by two FastAPI endpoints (`POST /api/notes`, `GET /api/notes`) that follow the existing Router → Service → Repository layering (`coding_standards.md` Section 2.2) and persist to PostgreSQL via SQLAlchemy 2.0 (sync) + psycopg 3.

The repository currently has **no persistence layer** (`app/models/`, `app/repositories/` are empty packages; `Settings.database_url` is read but never used). TEST-03's only dependency is TEST-01 (done), so this plan is self-contained and introduces the database layer itself: engine/session factory, declarative `Base`, the `notes` table, and the shared DB test fixtures in `backend/tests/conftest.py`. See `shared_risks.md`: if TEST-02 lands a DB layer first, the builder reuses it instead of duplicating.

Documented assumptions (criteria are silent; simplest choice per `user_story_alignment.md` Section 4 and the "keep every feature as small as possible" architecture note — carry these into the PR description):

1. **Schema management:** the `notes` table is created idempotently at app startup via `Base.metadata.create_all` (skipped with a logged warning when `DATABASE_URL` is unset, so the app and DB-less tests still start). No Alembic — a migration tool for one trivial table is gold plating here.
2. **Ordering:** `GET /api/notes` returns notes oldest-first (`id` ascending, insertion order), so a newly submitted note appears at the end of the list.
3. **Note length:** no maximum length is enforced beyond non-empty; `TEXT` column, no truncation.
4. **Empty means blank:** "empty note" includes whitespace-only input; text is trimmed before validation and storage on both sides.
5. **CORS is required for the feature to work at all:** the frontend is served on `http://localhost:5173` and calls the backend on `http://localhost:8000` (docker-compose, `.env.example`, Playwright base URL), a cross-origin request the current app would reject. `CORSMiddleware` is added with the frontend origin, configurable via settings.

## Frontend Plan

- Components to create/modify:
  - `frontend/src/api/notesClient.ts` (new): typed API client module — `listNotes(): Promise<Note[]>` and `createNote(text: string): Promise<Note>` over native `fetch`, `Note` interface (`id`, `text`, `createdAt` mapped from `created_at`). Base URL from `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"` (matches docker-compose and `.env.example`). Errors: network failure and non-2xx responses throw a typed `NotesApiError`; no retry logic (trivial internal API, no gold plating).
  - `frontend/src/components/Notes.tsx` (new): single functional component owning the whole slice — controlled text input, submit button, validation message, and the saved-notes list. On mount, loads notes via `listNotes()` (`useEffect`); on submit, trims the input, and if empty shows the validation message **without calling the client** (AC2), otherwise calls `createNote()` and appends the response to local state (AC1, no reload). A load/submit failure renders a visible error message (no silent `console.log`; strings kept as module-level constants, i18n-ready). One component is deliberate KISS: form and list share the notes state, and splitting into NoteForm/NoteList atoms adds indirection with no reuse.
  - `frontend/src/components/LandingPage.tsx` (modify): render `<Notes />` inside the existing `<main>`, below the subtitle. No other changes — existing testids (`landing-page`, `landing-title`, `app-footer`) stay untouched.
- Test attributes (stable, unique per page, `coding_standards.md` Section 3.6): `note-form`, `note-input`, `note-submit`, `note-validation-error`, `note-list`, `note-item-{id}`, `notes-error`.
- Routes: none (single-page app, no router).
- State management: local `useState`/`useEffect` in `Notes.tsx`; no context or state library needed.
- Design reference notes: AI freestyle (Design Reference mode NONE). Match the existing inline-`CSSProperties` styling convention of `LandingPage.tsx`/`AppFooter.tsx` (system-ui font, `#1a1a1a`/`#5f5f5f` palette), semantic markup (`<form>`, `<ul>`/`<li>`), `aria-label` on the input, validation message associated via `aria-describedby` and announced with `role="alert"`.

## Backend Plan

- Endpoints:
  - `POST /api/notes` — create a note; 201 with the stored note; 422 when the trimmed text is empty.
  - `GET /api/notes` — list all notes, oldest-first; 200 with a JSON array.
- Service layer (`app/services/note_service.py`): `create_note(session, text)` trims the text, raises `EmptyNoteError` when blank, otherwise stores via the repository and returns the model; `list_notes(session)` returns all notes ordered by `id`. This is where the non-empty business rule lives (unit-testable with a mocked repository).
- Repository layer (`app/repositories/note_repository.py`): `NoteRepository` with `add(session, text) -> Note` (flush to populate `id`/`created_at`) and `list_all(session) -> list[Note]` (ordered by `id` ascending), SQLAlchemy 2.0 style.
- Exceptions (`app/core/exceptions.py`, new): `AppException` base with `status_code`/`message`, `EmptyNoteError(AppException)` (422). A global handler registered in `create_app` returns consistent JSON (`{"detail": message}`) per `coding_standards.md` Section 2.3.
- DB plumbing (`app/core/db.py`, new): lazy engine + `sessionmaker` built from `Settings.database_url` (normalizing to the `postgresql+psycopg://` driver), declarative `Base`, `get_db` FastAPI dependency (yield session, commit on success / rollback on error — the transactional boundary), and `create_schema()` used by the app lifespan and the integration fixtures.
- Model (`app/models/note.py`): `Note` — `id` (PK, autoincrement), `text` (`Text`, not null), `created_at` (`DateTime(timezone=True)`, server default `now()`).
- Schemas (`app/schemas/note.py`): `NoteCreate` (`text: str`) and `NoteResponse` (`id`, `text`, `created_at`, `from_attributes=True`). Validation intentionally stays in the service (single home for the rule), not duplicated in the schema.
- App factory (`app/main.py`, modify): include the notes router alongside the existing version router; add `CORSMiddleware` (origins from a new `Settings.cors_origins`, default `["http://localhost:5173"]`, env-overridable via `CORS_ORIGINS`); register the `AppException` handler; add a lifespan that calls `create_schema()` when `database_url` is set and logs a warning (via `logging`, never `print`) when it is not.
- Migrations: none — idempotent `create_all` at startup (assumption 1).
- Dependencies (`backend/pyproject.toml`): add `sqlalchemy>=2.0` and `psycopg[binary]>=3.2`.

## API Integration Plan

No external API integration.

## API Contract

- Method: POST
- URL: `/api/notes`
- Request: `{"text": "Buy milk"}` (JSON body; text is trimmed server-side)
- Response: `201 Created`

  ```json
  {"id": 1, "text": "Buy milk", "created_at": "2026-07-28T09:15:00+00:00"}
  ```

  Error: `422 Unprocessable Entity` with `{"detail": "Note text must not be empty."}` when the trimmed text is empty (defence in depth behind the frontend check; also `422` from FastAPI's native validation when `text` is missing or not a string).

- Method: GET
- URL: `/api/notes`
- Request: no parameters
- Response: `200 OK`, array ordered oldest-first (empty array when no notes exist)

  ```json
  [
    {"id": 1, "text": "Buy milk", "created_at": "2026-07-28T09:15:00+00:00"},
    {"id": 2, "text": "Walk the dog", "created_at": "2026-07-28T09:16:30+00:00"}
  ]
  ```

The frontend consumes both exclusively through `frontend/src/api/notesClient.ts`.

## File Manifest

### New files
- `backend/app/core/db.py`: SQLAlchemy engine/session factory, declarative `Base`, `get_db` dependency, `create_schema()` helper
- `backend/app/core/exceptions.py`: `AppException` base class and `EmptyNoteError`
- `backend/app/models/note.py`: `Note` ORM model (`notes` table)
- `backend/app/schemas/note.py`: `NoteCreate` / `NoteResponse` Pydantic schemas
- `backend/app/repositories/note_repository.py`: `NoteRepository` (`add`, `list_all`)
- `backend/app/services/note_service.py`: `create_note` (trim + non-empty rule), `list_notes`
- `backend/app/routers/notes.py`: `POST /api/notes` (201) and `GET /api/notes` (200), router prefix `/api`, DI of the session
- `backend/tests/unit/test_note_service_unit.py`: service unit tests (mocked repository/session)
- `backend/tests/integration/test_notes_integration.py`: repository round-trip + router HTTP-cycle tests against real PostgreSQL
- `frontend/src/api/notesClient.ts`: typed notes API client
- `frontend/src/components/Notes.tsx`: note form + list component
- `frontend/src/components/Notes.test.tsx`: Vitest component tests (mocked client)
- `e2e/tests/TEST-03_simple_note_form.spec.ts`: Playwright E2E specs
- `e2e/uat/scenarios/TEST-03_simple_note_form.feature`: Gherkin UAT scenarios
- `e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md`: manual UAT clickthrough script

### Modified files
- `backend/pyproject.toml`: add `sqlalchemy>=2.0` and `psycopg[binary]>=3.2` to `[project].dependencies`
- `backend/app/main.py`: register notes router, CORS middleware, `AppException` handler, lifespan schema creation
- `backend/app/core/config.py`: add `cors_origins` setting (default `["http://localhost:5173"]`, `CORS_ORIGINS` env override)
- `backend/tests/conftest.py`: add module-scoped real-DB engine fixture (connects via `DATABASE_URL`, default `postgresql+psycopg://tasknotes:tasknotes@localhost:5432/tasknotes` matching docker-compose/CI; runs `create_schema()` as the migration runner), function-scoped session fixture with per-test transaction rollback, and an integration `db_client` fixture overriding `get_db`; the existing session-scoped `client` fixture stays unchanged for DB-less tests
- `frontend/src/components/LandingPage.tsx`: render `<Notes />` inside `<main>`
- `frontend/src/components/LandingPage.test.tsx`: mock the notes client so the existing landing-page assertions stay deterministic with the embedded `Notes` component

## Testing Strategy

- Unit tests: `note_service` business logic with the repository/session mocked — happy path (trimmed text stored and returned), edge case (surrounding whitespace trimmed; whitespace-only raises), error case (`EmptyNoteError` for `""`, and its 422 mapping). Frontend: `Notes.test.tsx` with `notesClient` mocked — renders fetched notes, submit appends the new note without reload, empty submit shows the validation message and makes **no** client call, client failure shows the error message.
  - Directory: `backend/tests/unit/` (backend); component test co-located per existing convention (`frontend/src/components/`)
  - Naming: `test_note_service_unit.py`; `Notes.test.tsx`
- Integration tests: real PostgreSQL (docker-compose `db` service; CI starts it via `docker compose up -d`). Repository: insert + retrieve round-trip, ordering by insertion, empty result set. Router: `POST /api/notes` 201 happy path, `POST` empty/whitespace text 422, `POST` missing field 422, `GET /api/notes` 200 with rows and with empty table. Per-test transaction rollback for isolation; no dependence on execution order.
  - Directory: `backend/tests/integration/` (file `test_notes_integration.py`)
- E2E tests: one spec per acceptance criterion plus a whitespace-only edge spec (table below). Unique per-run note text (timestamp suffix) so specs stay independent against the shared compose database; `data-testid` locators first; no hardcoded waits.
  - Directory: `e2e/tests/`
  - File: `TEST-03_simple_note_form.spec.ts`
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (whitespace-only note), and the manual clickthrough script with pass/fail checkboxes.
  - Directory: `e2e/uat/scenarios/` (`TEST-03_simple_note_form.feature`) and `e2e/uat/scripts/` (`TEST-03_simple_note_form_uat_script.md`)

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload | Goto `/`; set a `window` marker property; fill `note-input` with a unique text, click `note-submit`; expect the text visible in `note-list` and a `POST /api/notes` request observed via `page.waitForResponse`; assert the `window` marker survived (no full reload) | Given the landing page is open, When I type "Buy milk" and press Submit, Then "Buy milk" appears in the notes list without the page reloading |
| 2 | Submitting an empty note is rejected with a visible validation message and no API call | Goto `/`; register a `page.on("request")` listener for `/api/notes` POSTs; click `note-submit` with the input empty; expect `note-validation-error` visible and zero POST requests captured (also covered for whitespace-only input as the edge-case spec) | Given the landing page is open, When I press Submit with the note field empty, Then a validation message is shown And no note is added to the list |
| 3 | Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL) | Submit a unique note, await it in `note-list`, then `page.reload()`; expect the same text visible in `note-list` again (served by `GET /api/notes`) | Given I have saved the note "Buy milk", When I reload the page, Then "Buy milk" is still shown in the notes list |
