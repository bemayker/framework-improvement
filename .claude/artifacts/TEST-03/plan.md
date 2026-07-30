# Implementation Plan, TEST-03: Simple note form

## Feature
> Add a minimal note form to the landing page: a text input and a submit button that stores the note via the backend in PostgreSQL and shows the saved notes in a list. Deliberately trivial; exercises the fullstack slice (frontend, API, database) of the framework lifecycle.
>
> (Source: `docs/issues/TEST-03.md`, local work item, Work Item Source `hybrid`.)

## Acceptance Criteria
- [ ] Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload.
- [ ] Submitting an empty note is rejected with a visible validation message and no API call.
- [ ] Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL).

## Plan Overview

Full-stack vertical slice: a `notes` table in PostgreSQL, a Router → Service → Repository backend slice exposing `POST /api/notes` and `GET /api/notes` (`coding_standards.md` Section 2.2), and a note form plus note list on the existing landing page, wired through a dedicated frontend API client module. This is the first feature to open a database connection: the repo currently has **no** ORM dependency, engine, models, or repositories (only the TEST-05 version slice, which is DB-free), so this plan introduces the minimal persistence layer alongside the feature.

**Recorded decisions and assumptions** (made per `user_story_alignment.md` Section 4, documented rather than blocking):

1. **ORM and schema management:** SQLAlchemy 2.0 (sync) with the `psycopg[binary]` driver. No Alembic: the table is created at application startup via `metadata.create_all` inside the FastAPI lifespan. Alembic is disproportionate for a validation sandbox with one table ("keep every feature as small as possible", `CLAUDE.md` Architecture Notes).
2. **DB-free startup stays DB-free:** the lifespan runs `create_all` only when `Settings.database_url` is set, logging a warning otherwise. This keeps unit tests and the existing session-scoped `TestClient` fixture working without a database (CI's unit-test step has no `DATABASE_URL` on the host).
3. **CORS:** the frontend at `http://localhost:5173` calls the backend at `http://localhost:8000` directly (`VITE_API_BASE_URL` in `docker-compose.yml` / `.env.example`), which is cross-origin. Add FastAPI `CORSMiddleware` with the allowed origin read from settings (default `http://localhost:5173`).
4. **"Empty" includes whitespace-only:** the frontend trims before validating; the backend strips and rejects blank content with 422 (standard schema validation, not gold plating — the client-side "no API call" criterion is still met by the frontend check).
5. **List order:** `GET /api/notes` returns notes in insertion order (`id` ascending). No pagination, sorting options, edit, or delete — not requested (`user_story_alignment.md` Section 3).
6. **Test database:** integration-test fixtures read `DATABASE_URL` with a fallback of `postgresql://tasknotes:tasknotes@localhost:5432/tasknotes`, matching the compose service CI starts (`docker compose up -d` in `pr-tests.yml`) and local `docker compose up`.

## Frontend Plan

- Components to create/modify:
  - `frontend/src/api/notes.ts` (new): typed API client module — `fetchNotes(): Promise<Note[]>` and `createNote(content: string): Promise<Note>` — with the `Note` type, base URL from `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"`, and error handling (non-2xx → thrown typed error). No `fetch` calls scattered in components.
  - `frontend/src/components/NoteForm.tsx` (new): controlled text input + submit button. On submit: trim; if empty, show a validation message (`data-testid="note-validation-error"`) and make **no** API call; otherwise call the `onSubmit` prop and clear the input. Test IDs per `coding_standards.md` Section 3.6: `note-form`, `note-input`, `note-submit`, `note-validation-error`. Input carries an `aria-label`.
  - `frontend/src/components/NoteList.tsx` (new): renders the saved notes as a semantic `<ul>` (`data-testid="note-list"`, items `data-testid="note-list-item-{id}"`). Empty state: renders nothing visually heavy, just an empty list (no invented empty-state copy beyond a simple message-free list).
  - `frontend/src/components/LandingPage.tsx` (modified): owns the notes state via `useState`/`useEffect` — fetch notes on mount through the API client, append the created note on successful submit (no refetch round-trip needed; state update satisfies "appears without a full page reload"). Renders `NoteForm` and `NoteList` inside the existing `<main>`. Existing layout, title, and `AppFooter` untouched.
- Routes: none (single-page app, no router).
- State management: local component state in `LandingPage` (native React state per `coding_standards.md` Section 3.5; no state library).
- Design reference notes: AI freestyle (Design Reference `Mode: NONE`) — match the existing inline-`CSSProperties` styling convention already used by `LandingPage`/`AppFooter`; clean minimal form, mobile-first widths.
- Frontend unit tests (Vitest, colocated `*.test.tsx` per the existing `LandingPage.test.tsx` convention, mocked API client): `NoteForm.test.tsx`, `NoteList.test.tsx`, updated `LandingPage.test.tsx`.

## Backend Plan

- Endpoints:
  - `POST /api/notes` — create a note; 201 with the created note; 422 for blank/missing content.
  - `GET /api/notes` — list all notes, `id` ascending; 200.
  - Router: `backend/app/routers/notes.py`, `APIRouter(prefix="/api", tags=["notes"])`, matching the existing `version.py` convention. No business logic in the router (`coding_standards.md` Section 2.2).
- Service layer: `backend/app/services/note_service.py` — `NoteService` with `create_note(content)` (strips content, raises the validation path for blank input) and `list_notes()`. Repository injected via a `Protocol` so unit tests mock it (`coding_standards.md` Section 2.1 Contracts).
- Repository layer: `backend/app/repositories/note_repository.py` — `NoteRepository` over a SQLAlchemy session: `add(content) -> Note`, `list_all() -> list[Note]`.
- Persistence plumbing (new in this feature):
  - `backend/app/core/db.py` — lazily-created SQLAlchemy engine + session factory from `Settings.database_url`; FastAPI dependency yielding a session per request; `create_all` helper invoked from the app lifespan (decision 2 above).
  - `backend/app/models/note.py` — SQLAlchemy declarative `Note` model: `id` (int PK), `content` (text, not null), `created_at` (timestamptz, server default `now()`).
  - `backend/app/schemas/note.py` — `NoteCreate` (`content: str`, min length 1 after strip via validator) and `NoteResponse` (`id`, `content`, `created_at`), separate from the model (`coding_standards.md` Section 2.2 point 4).
  - `backend/app/core/config.py` — add `cors_origins` setting (env `CORS_ORIGINS`, default `http://localhost:5173`).
  - `backend/app/main.py` — register the notes router, add `CORSMiddleware`, add the lifespan that conditionally runs `create_all`.
  - `backend/pyproject.toml` — add `sqlalchemy>=2.0` and `psycopg[binary]>=3.2` to dependencies.
- Migrations: none — `metadata.create_all` at startup (decision 1 above). The integration-test fixtures create/drop the tables directly.

## API Integration Plan

No external API integration.

## API Contract

**Create note**
- Method: POST
- URL: `/api/notes`
- Request: `{"content": "Buy milk"}` (JSON body; `content` non-empty after trimming)
- Response: `201 Created`

  ```json
  {"id": 1, "content": "Buy milk", "created_at": "2026-07-30T12:00:00Z"}
  ```

- Errors: `422 Unprocessable Entity` (FastAPI/Pydantic validation shape) when `content` is missing, empty, or whitespace-only.

**List notes**
- Method: GET
- URL: `/api/notes`
- Request: none
- Response: `200 OK`, notes in insertion order (`id` ascending)

  ```json
  [
    {"id": 1, "content": "Buy milk", "created_at": "2026-07-30T12:00:00Z"},
    {"id": 2, "content": "Walk the dog", "created_at": "2026-07-30T12:01:00Z"}
  ]
  ```

## File Manifest

### New files
- [B] backend/app/core/db.py: SQLAlchemy engine/session factory, session dependency, create_all helper
- [B] backend/app/models/note.py: Note ORM model (id, content, created_at)
- [B] backend/app/schemas/note.py: NoteCreate / NoteResponse Pydantic schemas
- [B] backend/app/repositories/note_repository.py: NoteRepository (add, list_all) over a SQLAlchemy session
- [B] backend/app/services/note_service.py: NoteService business logic with injected repository Protocol
- [B] backend/app/routers/notes.py: POST /api/notes and GET /api/notes router
- [B] backend/tests/unit/test_note_service_unit.py: NoteService unit tests with mocked repository
- [B] backend/tests/integration/test_notes_integration.py: repository round-trip + router HTTP-cycle tests against real PostgreSQL
- [A] frontend/src/api/notes.ts: typed notes API client (fetchNotes, createNote, Note type, error handling)
- [A] frontend/src/components/NoteForm.tsx: controlled note input + submit with client-side empty validation
- [A] frontend/src/components/NoteList.tsx: saved-notes list rendering
- [A] frontend/src/components/NoteForm.test.tsx: NoteForm Vitest tests (submit, empty rejection, clearing)
- [A] frontend/src/components/NoteList.test.tsx: NoteList Vitest tests (items, empty list)
- [D] e2e/tests/TEST-03_simple_note_form.spec.ts: Playwright specs for the three acceptance criteria
- [G] e2e/uat/scenarios/TEST-03_simple_note_form.feature: Gherkin UAT scenarios
- [G] e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md: manual UAT clickthrough script

### Modified files
- [B] backend/app/main.py: register notes router, add CORSMiddleware, add lifespan with conditional create_all
- [B] backend/app/core/config.py: add cors_origins setting
- [B] backend/pyproject.toml: add sqlalchemy and psycopg[binary] dependencies
- [B] backend/tests/conftest.py: add module-scoped real-database engine fixture, table create/teardown, per-test cleanup, DB-backed client fixture for integration tests
- [A] frontend/src/components/LandingPage.tsx: notes state (fetch on mount, append on create), render NoteForm and NoteList in main
- [A] frontend/src/components/LandingPage.test.tsx: cover the notes wiring with a mocked API client

## Testing Strategy

- Unit tests (`testing_standards.md` Sections 1.1 and 4: happy path, edge case, error case per tested function; DB mocked):
  - Backend: `NoteService.create_note` — happy path, whitespace-stripping edge case, blank-content error; `NoteService.list_notes` — returns repository result, empty-list edge case. Repository mocked via the Protocol.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py → `test_note_service_unit.py`
  - Frontend (Vitest, jsdom, colocated): NoteForm submit/validation/no-call-on-empty, NoteList rendering, LandingPage fetch-on-mount and append-on-create with the API client mocked.
- Integration tests (ENABLED per `CLAUDE.md`; `testing_standards.md` Section 1.2 — never mock the database here):
  - Repository: insert + retrieve round-trip, insertion ordering, empty result set.
  - Router: `POST /api/notes` 201 cycle, `POST` 422 on blank content, `GET /api/notes` 200 (empty and populated).
  - Fixtures in `backend/tests/conftest.py`: module-scoped engine against the compose PostgreSQL (decision 6), tables created for the module, per-test cleanup (delete rows) so tests are order-independent.
  - Directory: backend/tests/integration/ → `test_notes_integration.py`
- E2E tests (ENABLED per `CLAUDE.md`; `data-testid` locators first per `testing_standards.md` Section 1.3):
  - Add a unique-per-run note (timestamped content, since the dev database persists between runs) and assert it appears in the list without navigation; submit empty and assert the validation message shows and no `POST /api/notes` request fires (route interception to observe, UI-driven otherwise); reload the page and assert the note is still listed.
  - Directory: e2e/tests/
  - File: {feature_id}_{slug}.spec.ts → `TEST-03_simple_note_form.spec.ts`
- UAT scenarios (ENABLED per `CLAUDE.md`; one scenario per criterion plus an edge case, `testing_standards.md` Section 4; no duplication of E2E interaction assertions):
  - Gherkin: e2e/uat/scenarios/`TEST-03_simple_note_form.feature`
  - Manual script: e2e/uat/scripts/`TEST-03_simple_note_form_uat_script.md`

## Acceptance Test Outline

| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Non-empty note is stored via POST /api/notes and appears in the list without a full page reload | Fill `note-input` with a unique timestamped text, click `note-submit`, assert the text appears in `note-list` with no `page.goto`/navigation | Given the landing page is open, When I type "Buy milk" and click Add, Then "Buy milk" appears in the notes list without the page reloading |
| 2 | Empty note is rejected with a visible validation message and no API call | Intercept `POST /api/notes` via route interception, click `note-submit` with an empty input, assert `note-validation-error` is visible and the interceptor saw no request | Given the landing page is open, When I click Add with the input empty, Then a validation message is shown and no note is added |
| 3 | Saved notes persist across a page reload | After adding the unique note, `page.reload()`, assert the note is still present in `note-list` | Given I have added "Buy milk", When I reload the page, Then "Buy milk" is still listed |
