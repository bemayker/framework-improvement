# Implementation Plan, TEST-03: Simple note form

## Feature
> Add a minimal note form to the landing page: a text input and a submit button that stores the note via the backend in PostgreSQL and shows the saved notes in a list. Deliberately trivial; exercises the fullstack slice (frontend, API, database) of the framework lifecycle.

## Acceptance Criteria
- [ ] Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload.
- [ ] Submitting an empty note is rejected with a visible validation message and no API call.
- [ ] Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL).

## Plan Overview
TEST-03 is the first vertical slice through the whole stack: a React form on the existing landing page calls two new FastAPI endpoints (`POST /api/notes`, `GET /api/notes`) that persist notes in PostgreSQL through the layered backend (Router → Service → Repository) whose packages TEST-01 created empty. Because TEST-03 depends only on TEST-01 (not on TEST-02, which is still `todo`), **this item also introduces the database connectivity layer** the TEST-01 comments deferred to TEST-02: a SQLAlchemy engine/session module, one `notes` table, and the DB fixtures in `backend/tests/conftest.py` that TEST-01 left documented as placeholders.

Scope is held to the three acceptance criteria (`user_story_alignment.md` Section 3, CLAUDE.md "Keep every feature as small as possible"): create and list only — **no** edit, delete, pagination, sorting controls, auth, or optimistic-UI machinery. The landing page keeps its existing title/subtitle and `data-testid`s untouched and gains one notes section. Every addition to `backend/app/main.py` is additive (one `include_router`, one exception handler, CORS middleware) so TEST-02 can register its health router later without restructuring.

Design Reference is `NONE`, so the UI is plain, accessible, inline-styled React consistent with the existing `LandingPage.tsx` (no CSS framework and no icon library are configured in `CLAUDE.md`).

### Assumptions recorded (ambiguities decided rather than blocking, `user_story_alignment.md` Sections 2 and 4)
1. **DB layer ownership.** TEST-01's code comments say DB connectivity lands with TEST-02, but TEST-03 does not depend on TEST-02 and cannot satisfy criterion 3 without persistence. TEST-03 therefore adds `backend/app/core/db.py`, and it is written so TEST-02 consumes it rather than replacing it.
2. **Query layer / migrations.** `CLAUDE.md` names PostgreSQL but no ORM or migration tool. Choice: **SQLAlchemy 2.0** (declarative ORM, sync `Session`) with the **psycopg 3** driver, and schema creation via an idempotent `init_db()` calling `Base.metadata.create_all(engine)` — no Alembic. Alembic is the right call for a real product but is gold plating for a one-table validation sandbox; `init_db()` also serves as the migration runner the shared test fixtures need (`testing_standards.md` Section 1.2).
3. **URL scheme normalisation.** `.env.example` and `docker-compose.yml` ship `postgresql://…`, whose SQLAlchemy default driver is psycopg2 (not installed). `config.py` normalises the scheme to `postgresql+psycopg://` so neither file has to change.
4. **CORS is required, not optional.** The browser serves the app from `http://localhost:5173` and calls the API on `http://localhost:8000`; that is cross-origin, so `CORSMiddleware` with an allow-list from settings (default `http://localhost:5173`) is functionally necessary for criteria 1 and 3.
5. **Note shape and ordering.** A note is `{ id, text, created_at }`; `text` is required, trimmed, max 500 characters. The list renders **newest first** (ordering is unspecified in the criteria; newest-first matches the "it appears in the list" expectation after submitting).
6. **Empty-note handling is enforced twice.** Criterion 2 explicitly requires *no API call*, so the guard is client-side in the form; the endpoint additionally rejects blank text with `422` as defence in depth (that server rule is covered by an integration test, not by the E2E spec).
7. **Startup DB init tolerates a missing `DATABASE_URL`.** The app lifespan calls `init_db()` only when `DATABASE_URL` is set, logging a warning otherwise, so backend **unit** tests keep running with no database (`testing_standards.md` Section 1.1) while Docker Compose and CI get their table created.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/NoteForm.tsx` (new) — controlled text input + submit button. Blocks submission of empty/whitespace-only input and renders a visible validation message instead of calling the API. `data-testid`: `note-form`, `note-input`, `note-submit`, `note-error`.
  - `frontend/src/components/NoteList.tsx` (new) — semantic `<ul>` of saved notes, newest first; renders an empty-state line when there are none. `data-testid`: `note-list`, `note-item-{id}`, `note-list-empty`.
  - `frontend/src/components/LandingPage.tsx` (modified) — keeps the existing `<header>`/`<h1>` and subtitle plus their current `data-testid`s untouched, and adds a `<section data-testid="notes-section">` inside `<main>` holding `NoteForm` and `NoteList`. It consumes the `useNotes` hook and stays presentational.
- Hook to create: `frontend/src/hooks/useNotes.ts` — owns notes state, initial load on mount, and the create call (`coding_standards.md` Section 3.3: custom hook for reusable logic, native state APIs only, no state library). Exposes `{ notes, addNote, isLoading, loadError, submitError }`.
- API client to create: `frontend/src/api/notes.ts` — the only module that talks HTTP (`coding_standards.md` Section 4: no fetch calls scattered in components). Typed `Note`, `fetchNotes()`, `createNote(text)`; base URL from `import.meta.env.VITE_API_BASE_URL` with the documented `http://localhost:8000` dev fallback; maps non-2xx and network failures to a typed error.
- Routes: none. The app remains a single page at `/` (no router is installed and none is added).
- State management: React `useState` + `useEffect` inside `useNotes`. After a successful `POST`, the created note from the response is prepended to state — no page reload and no refetch (criterion 1).
- Design reference notes: `NONE` mode → AI freestyle, matching the existing inline `CSSProperties` style objects in `LandingPage.tsx`. Semantic `<section>`/`<form>`/`<ul>`, a `<label>` bound to the input, `aria-invalid` + `role="alert"` on the validation message, mobile-first widths (`width: 100%`, `maxWidth`), no external fonts or icons.

## Backend Plan
- Endpoints:
  - `POST /api/notes` — create a note. `201 Created`, body `NoteRead`. Blank text → `422`.
  - `GET /api/notes` — list all notes, newest first. `200 OK`, body `NoteRead[]`.
- Router layer (`backend/app/routers/notes.py`): `APIRouter(prefix="/api/notes", tags=["notes"])`, request validation via the Pydantic schemas, `Session` injected with `Depends(get_session)`, service constructed from it. No business logic (`coding_standards.md` Section 2.2).
- Service layer (`backend/app/services/note_service.py`): `NoteService(repository)` with `create_note(payload) -> Note` (trims text, raises `EmptyNoteError` when nothing remains, commits — the transactional boundary lives here) and `list_notes() -> list[Note]`. Uses `logging.getLogger(__name__)`; never `print()`.
- Repository layer (`backend/app/repositories/note_repository.py`): `NoteRepository(session)` with `add(text) -> Note` (flush so the generated `id`/`created_at` are populated, no commit) and `list_all() -> list[Note]` (`select(Note).order_by(Note.created_at.desc(), Note.id.desc())`). SQLAlchemy only here.
- Domain model (`backend/app/models/note.py`): declarative `Note` on table `notes` — `id` `Integer` PK autoincrement, `text` `String(500)` not null, `created_at` `DateTime(timezone=True)` not null with `server_default=func.now()`.
- Schemas (`backend/app/schemas/note.py`): `NoteCreate` (`text: str`, `min_length=1`, `max_length=500`, whitespace stripped) and `NoteRead` (`id`, `text`, `created_at`; `from_attributes=True`). Kept separate from the ORM model.
- Connectivity (`backend/app/core/db.py`): module-level lazy `create_engine` from `Settings.sqlalchemy_url`, `sessionmaker`, declarative `Base`, `get_session()` FastAPI dependency (yields a session, always closes), and idempotent `init_db()` (`Base.metadata.create_all`). Connection details come exclusively from `DATABASE_URL`; nothing is hardcoded.
- Errors (`backend/app/core/exceptions.py`): `AppException` base plus `EmptyNoteError`, with a single handler registered in `main.py` returning `{"detail": "<message>"}` and `422` (`coding_standards.md` Section 2.3).
- `backend/app/main.py` (modified, additive only): register the notes router, register the `AppException` handler, add `CORSMiddleware` from `Settings.cors_origins`, and add a lifespan that calls `init_db()` when `DATABASE_URL` is set.
- `backend/app/core/config.py` (modified): add `cors_origins` (from `CORS_ORIGINS`, default `http://localhost:5173`) and a `sqlalchemy_url` helper that normalises `postgresql://` → `postgresql+psycopg://`.
- Migrations: none as files. The `notes` table is created by `init_db()` (assumption 2) — on app startup in Compose/CI, and by the integration-test migration-runner fixture.
- Dependencies (`backend/pyproject.toml`): add `sqlalchemy>=2.0` and `psycopg[binary]>=3.2`; `uv.lock` is regenerated by `uv sync`.

## API Integration Plan
No external API integration. The only HTTP boundary is this project's own backend.

## API Contract

### `POST /api/notes`
- Method: `POST`
- URL: `/api/notes`
- Request: `{ "text": string }` — required, trimmed, 1..500 characters
- Response `201`:
  ```json
  { "id": 1, "text": "Buy milk", "created_at": "2026-07-28T09:41:12.334Z" }
  ```
- Response `422` (blank or over-long text):
  ```json
  { "detail": "Note text must not be empty." }
  ```

### `GET /api/notes`
- Method: `GET`
- URL: `/api/notes`
- Request: no body, no query parameters
- Response `200` (newest first; `[]` when there are none):
  ```json
  [
    { "id": 2, "text": "Call the dentist", "created_at": "2026-07-28T09:44:02.011Z" },
    { "id": 1, "text": "Buy milk", "created_at": "2026-07-28T09:41:12.334Z" }
  ]
  ```

## File Manifest

### New files
**Backend (10)**
- `backend/app/core/db.py`: engine, `sessionmaker`, `Base`, `get_session()` dependency, idempotent `init_db()`.
- `backend/app/core/exceptions.py`: `AppException` base and `EmptyNoteError`.
- `backend/app/models/note.py`: SQLAlchemy `Note` model on table `notes`.
- `backend/app/schemas/note.py`: `NoteCreate` / `NoteRead` DTOs.
- `backend/app/repositories/note_repository.py`: `NoteRepository.add()` / `.list_all()`.
- `backend/app/services/note_service.py`: `NoteService.create_note()` / `.list_notes()`, transaction boundary, trim + empty guard.
- `backend/app/routers/notes.py`: `POST /api/notes`, `GET /api/notes`.
- `backend/tests/unit/test_note_service_unit.py`: service unit tests against a stub repository.
- `backend/tests/integration/test_note_repository_integration.py`: repository round-trip against real PostgreSQL.
- `backend/tests/integration/test_notes_router_integration.py`: full HTTP cycle for both endpoints.

**Frontend (7)**
- `frontend/src/api/notes.ts`: typed notes API client (`Note`, `fetchNotes`, `createNote`).
- `frontend/src/hooks/useNotes.ts`: notes state, initial load, create.
- `frontend/src/hooks/useNotes.test.ts`: hook tests with `fetch` mocked.
- `frontend/src/components/NoteForm.tsx`: input + submit + client-side empty validation.
- `frontend/src/components/NoteForm.test.tsx`: form behaviour tests.
- `frontend/src/components/NoteList.tsx`: notes list + empty state.
- `frontend/src/components/NoteList.test.tsx`: list rendering tests.

**E2E / UAT (3)**
- `e2e/tests/TEST-03_simple_note_form.spec.ts`: browser specs for all three criteria plus an edge case.
- `e2e/uat/scenarios/TEST-03_simple_note_form.feature`: Gherkin scenarios (UAT ENABLED).
- `e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md`: manual UAT clickthrough script.

**Total new: 20**

### Modified files
- `backend/pyproject.toml`: add `sqlalchemy>=2.0` and `psycopg[binary]>=3.2`.
- `backend/uv.lock`: regenerated by `uv sync` (do not hand-edit).
- `backend/app/core/config.py`: add `cors_origins` and the `sqlalchemy_url` scheme normalisation; update the TEST-01 comment that says no DB connection exists.
- `backend/app/main.py`: include the notes router, register the `AppException` handler, add `CORSMiddleware`, add the lifespan `init_db()` call.
- `backend/tests/conftest.py`: replace the documented placeholders with the real DB fixtures — module-scoped engine bound to `DATABASE_URL`, `init_db()` migration-runner fixture, per-test transactional session rolled back after each test, and a client fixture overriding `get_session` with that session.
- `backend/tests/unit/test_main_unit.py`: `test_create_app_registers_no_feature_routes` **will now fail by design** — it asserts the app exposes no custom routes. Rewrite it to assert the notes routes are registered (`/api/notes` for `GET` and `POST`); keep the other two tests unchanged.
- `frontend/src/components/LandingPage.tsx`: add the notes section wired to `useNotes`; existing title/subtitle and their `data-testid`s stay byte-identical.
- `frontend/src/components/LandingPage.test.tsx`: keep the three existing assertions green by stubbing `fetch` (the page now loads notes on mount); add one test that the notes section renders.
- `.github/workflows/pr-tests.yml`: integration tests now need a reachable database — use `docker compose up -d --wait` in "Start services" so the `db` healthcheck is honoured before tests run, and set `DATABASE_URL: postgresql://tasknotes:tasknotes@localhost:5432/tasknotes` (the Compose defaults, ephemeral CI credentials) on the "Backend integration tests" step. Leave the unit-test steps without `DATABASE_URL` so unit tests stay database-free.

**Total modified: 9**

## Testing Strategy
- Unit tests: **warranted** (new service-layer business logic and new frontend components/hook).
  - Backend — `NoteService`: happy path (text is trimmed, repository called, transaction committed), edge case (surrounding whitespace / 500-character boundary), error case (whitespace-only text raises `EmptyNoteError` and nothing is committed). Repository and session are stubbed, no database (`testing_standards.md` Section 1.1).
    - Directory: `backend/tests/unit/` — naming `test_{module}_unit.py` → `test_note_service_unit.py`
  - Frontend (Vitest + Testing Library, colocated `*.test.tsx`) — `NoteForm`: submitting text calls the handler once with the trimmed value; submitting empty/whitespace shows `note-error` and calls **nothing**. `NoteList`: renders notes newest-first, shows `note-list-empty` when the list is empty. `useNotes`: loads notes on mount, prepends the created note, surfaces a request failure. `fetch` is mocked; the API client is never hit for real.
  - Naming follows `test_{action}_{scenario}_{expected}` (`testing_standards.md` Section 3).
- Integration tests: **warranted** (new repository, model, and router). ENABLED per `CLAUDE.md`.
  - `test_note_repository_integration.py`: insert + retrieve round-trip, ordering (newest first), empty result set on a clean table, and a not-null constraint violation for `text=None`.
  - `test_notes_router_integration.py`: `POST /api/notes` → `201` with the created body; `GET /api/notes` → `200` containing it; `POST` with `""` → `422`; `GET` on an empty table → `200 []`.
  - Real PostgreSQL from `docker-compose.yml` via `DATABASE_URL` (never a hardcoded connection string); each test runs in a transaction rolled back afterwards, so tests are order-independent.
  - Directory: `backend/tests/integration/` — naming `test_{module}_integration.py`
- E2E tests: **warranted** (all three criteria are user-facing browser interactions). ENABLED per `CLAUDE.md`.
  - Specs: submit a note and see it appear without a reload; submit empty and see the validation message with no request leaving the page (assert via a `page.route`/request listener that no `POST /api/notes` is issued); reload and still see the note.
  - Deterministic data: each spec generates a unique note text (`TEST-03 note ${Date.now()}-${randomId}`) and asserts on that text only, so specs stay independent and parallel-safe against a persistent database (no reliance on an empty list, no strict-mode collisions). Locators use `data-testid` first (`testing_standards.md` Section 1.3).
  - Directory: `e2e/tests/`
  - File: `TEST-03_simple_note_form.spec.ts`
- UAT scenarios: **warranted**, ENABLED per `CLAUDE.md` — one scenario per criterion plus an edge-case scenario (whitespace-only input is rejected), plus the manual clickthrough script.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`
- Local gate before commit: `cd backend && uv run pytest -q && cd ../frontend && npm test` (`CLAUDE.md` Test gate command), with `docker compose up -d --wait` first so the integration tier has its database. One headless smoke run of `TEST-03_simple_note_form.spec.ts` per `testing_standards.md` Section 2.1.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Non-empty note is stored via `POST /api/notes` and appears in the list without a full page reload | Go to `/`; fill `note-input` with a unique text; click `note-submit`; await the `POST /api/notes` response; assert the text is visible in `note-list` and that no navigation happened (capture the initial page instance / assert no `framenavigated` on the main frame) | Given the app is open, When I type "Buy milk" and click Add note, Then "Buy milk" appears in the notes list without the page reloading |
| 2 | Empty note is rejected with a visible validation message and no API call | Register a request listener asserting zero `POST /api/notes` requests; click `note-submit` with `note-input` empty; assert `note-error` is visible and `note-list` is unchanged | Given the app is open, When I click Add note with the input empty, Then I see the message "Note text is required" and nothing is sent to the server |
| 3 | Saved notes persist across a reload (`GET /api/notes` reads from PostgreSQL) | Submit a unique note, `page.reload()`, then assert the same text is still visible in `note-list` after the `GET /api/notes` response resolves | Given I have saved the note "Call the dentist", When I reload the page, Then "Call the dentist" is still in the notes list |
| — | Edge case (beyond the criteria, one per feature per `testing_standards.md` Section 4) | Submit whitespace-only input (`"   "`): assert `note-error` is visible and no `POST` is issued | Given the app is open, When I type only spaces and click Add note, Then I see the validation message and no note is added |
