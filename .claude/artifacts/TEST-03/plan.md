# Implementation Plan, TEST-03: Simple note form

## Feature
> Add a minimal note form to the landing page: a text input and a submit button that stores the note via the backend in PostgreSQL and shows the saved notes in a list. Deliberately trivial; exercises the fullstack slice (frontend, API, database) of the framework lifecycle.

## Acceptance Criteria
- [ ] Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload.
- [ ] Submitting an empty note is rejected with a visible validation message and no API call.
- [ ] Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL).

## Plan Overview

TEST-03 is the first feature to touch the database: the repo currently has no PostgreSQL driver, no models, and empty `repositories/` packages (the `db` service in `docker-compose.yml` and `DATABASE_URL` in `Settings` exist but are unused). This plan introduces the full Router → Service → Repository slice for one `notes` table (`coding_standards.md` Section 2.2), two endpoints (`POST /api/notes`, `GET /api/notes`), and a note form plus note list on the existing `LandingPage`. Per `CLAUDE.md` Architecture Notes ("keep every feature as small as possible") and `user_story_alignment.md` Section 3, there is no edit, delete, pagination, or ordering UI — only what the three criteria require.

Assumptions recorded (per `user_story_alignment.md` Section 2, to be repeated in the PR description):

1. A whitespace-only note counts as empty: the text is trimmed on both sides before validation.
2. Notes are listed in insertion order (ascending `id`); no ordering criterion is given.
3. The response shape is `{id, text}`; no `created_at` column, since no criterion needs one.
4. The backend also rejects an empty/whitespace note (422) even though the frontend never sends one — criterion 2 governs the frontend behaviour, the schema constraint keeps the API honest.
5. Code comments in `backend/app/main.py` and `backend/tests/conftest.py` say TEST-02 would introduce DB connectivity, but TEST-02 is not merged and TEST-03 is the first DB consumer to build, so the DB layer lands here (flagged in `shared_risks.md`).
6. The existing integration test `test_get_version_answers_when_database_url_is_unset` creates the app with `DATABASE_URL` deleted, so app startup must not hard-require a database: the lifespan schema init is skipped with a logged warning when `database_url` is `None`.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/NoteForm.tsx` (new): controlled text input plus submit button inside a `<form>`. On submit: trim; if empty, set a local error state rendered as a visible message (`data-testid="note-form-error"`) and make no API call; otherwise call the API client's `createNote`, clear the input, and invoke an `onCreated(note)` callback prop. Test ids per `coding_standards.md` Section 3.6: `note-form`, `note-input`, `note-submit`, `note-form-error`.
  - `frontend/src/components/NoteList.tsx` (new): presentational `<ul data-testid="note-list">` of the saved notes, one `<li data-testid={"note-list-item-" + id}>` per note (suffix pattern for uniqueness).
  - `frontend/src/components/LandingPage.tsx` (modified): holds the `notes` state (`useState`), loads it once on mount via `listNotes` (`useEffect`), renders `NoteForm` (appending to state via `onCreated`, which is what makes the new note appear without a reload) and `NoteList` inside the existing `<main>`. Existing title, subtitle, and `AppFooter` stay untouched.
  - `frontend/src/api/notes.ts` (new): typed API client (`Note` type, `listNotes()`, `createNote(text)`) using native `fetch` against `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"` (the variable `docker-compose.yml` and `.env.example` already declare). Throws on non-OK responses; components surface the thrown error via the form's error message state. No fetch calls scattered in components (`coding_standards.md` Section 4 client-layer rule applied to the internal API).
  - `frontend/tsconfig.json` (modified): add `"vite/client"` to `compilerOptions.types` (the explicit `types` array currently suppresses it, so `import.meta.env` would not typecheck).
- Routes: none; the app stays a single landing page.
- State management: local `useState`/`useEffect` in `LandingPage`, matching the repo's existing pattern; no state library, no context.
- Design reference notes: `Mode: NONE` — AI freestyle, matching the existing inline-`CSSProperties` styling convention of `LandingPage`/`AppFooter` (this repo's established pattern; the utility-CSS rule has no local precedent here).

## Backend Plan
- Endpoints:
  - `POST /api/notes` — create a note; 201 with the created note; 422 (FastAPI/Pydantic) on empty or whitespace-only text.
  - `GET /api/notes` — list all notes, ascending `id`; 200, `[]` when none exist.
- Router: `backend/app/routers/notes.py`, `APIRouter(prefix="/api", tags=["notes"])`, mirroring `routers/version.py`. No business logic in the router; it delegates to the service via a dependency-injected repository.
- Service layer: `backend/app/services/note_service.py` — `create_note(repository, text)` (trims, delegates insert) and `list_notes(repository)`. Trivial by design; it exists to keep the layering uniform with `version_service.py` and give the unit tier a seam. No custom exception classes are introduced: the only client error case (empty text) is handled at the schema layer, and an unreachable database is a genuine 500; unexpected errors are logged with `logging` (stdlib), matching `version_service.py` — never `print()` (`coding_standards.md` Section 2.3).
- Repository layer: `backend/app/repositories/note_repository.py` — `insert_note(text) -> Note` (`INSERT ... RETURNING id, text`) and `list_notes() -> list[Note]` (`SELECT ... ORDER BY id`), raw parameterized SQL via psycopg on a connection provided by `core/db.py`.
- Connection/dependency: `backend/app/core/db.py` — a FastAPI dependency yielding a per-request `psycopg.connect(settings.database_url)` connection (committed on success, closed always), plus `ensure_schema(conn_or_url)` running the DDL below.
- Schemas: `backend/app/schemas/note.py` — `NoteCreate` (`text: str`, trimmed, min length 1 via Pydantic field constraints) and `NoteResponse` (`id: int`, `text: str`), separate from the domain model per `coding_standards.md` Section 2.2.
- Domain model: `backend/app/models/note.py` — frozen dataclass `Note(id: int, text: str)`.
- Migrations: no migration framework. Schema is created idempotently at app startup (lifespan hook in `main.py` calling `ensure_schema`, skipped with a logged warning when `database_url` is unset — assumption 6):

  ```sql
  CREATE TABLE IF NOT EXISTS notes (
      id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      text TEXT NOT NULL CHECK (btrim(text) <> '')
  );
  ```

- `backend/app/main.py` (modified): register the notes router, add the lifespan schema init, and add Starlette `CORSMiddleware` allowing the frontend origin (from a new `cors_origins` setting in `core/config.py`, default `["http://localhost:5173"]`) — the browser at `:5173` calls the backend at `:8000` directly per the existing `VITE_API_BASE_URL` wiring, which is cross-origin.
- `backend/pyproject.toml` (modified): add `psycopg[binary]>=3.2` to `[project].dependencies`; `backend/uv.lock` regenerates with it.

## API Integration Plan
No external API integration.

## API Contract
- Method: POST
  - URL: `/api/notes`
  - Request: `{"text": "Buy milk"}` (`text`: string, trimmed server-side, min length 1 after trim)
  - Response: `201 Created`, `{"id": 1, "text": "Buy milk"}`
  - Errors: `422 Unprocessable Entity` (FastAPI's standard `{"detail": [...]}` body) when `text` is missing, empty, or whitespace-only.
- Method: GET
  - URL: `/api/notes`
  - Request: no parameters
  - Response: `200 OK`, `[{"id": 1, "text": "Buy milk"}, {"id": 2, "text": "Walk dog"}]` ascending by `id`; `[]` when no notes exist.

## Technology Selection
- PostgreSQL driver (`psycopg[binary]>=3.2`, the one net-new dependency): no stdlib module and no installed dependency speaks PostgreSQL; chose psycopg 3 with raw parameterized SQL over SQLAlchemy + Alembic, because one table with an insert and a select needs neither an ORM nor a migration framework.
- Schema creation: idempotent `CREATE TABLE IF NOT EXISTS` at app startup through the driver already being added, chosen over adding Alembic as a second new dependency.
- Connection handling: per-request `psycopg.connect` via a FastAPI dependency, chosen over adding `psycopg_pool`; sandbox-scale traffic does not justify a pooling dependency.
- Non-empty note enforcement (backend): Pydantic field constraints on the already-installed pydantic (ships with FastAPI), backed by a `CHECK (btrim(text) <> '')` in the DDL (a database constraint over application code), chosen over a hand-written validator module.
- CORS: Starlette `CORSMiddleware`, already installed via FastAPI, chosen over any new package and over rewiring the frontend to a Vite dev proxy (docker-compose already publishes `VITE_API_BASE_URL` for direct browser-to-backend calls, so the middleware fits the existing wiring).
- Frontend HTTP: native `fetch` (platform feature), chosen over adding axios or another HTTP client.
- Frontend state: React `useState`/`useEffect` (already installed), chosen over adding a state-management library.
- Empty-note validation message (frontend): a React state-driven inline message, chosen over the native `required` constraint-validation bubble (the rung-2 candidate), because criterion 2's visible message must be assertable by the E2E and UAT tiers as a DOM element with a `data-testid`, and the native bubble is browser-rendered, browser-worded, and not queryable from Playwright.

## File Manifest

### New files
- [B] backend/app/core/db.py: per-request psycopg connection dependency plus idempotent `ensure_schema` (notes table DDL)
- [B] backend/app/models/note.py: frozen dataclass domain model `Note(id, text)`
- [B] backend/app/repositories/note_repository.py: `insert_note` / `list_notes` via raw parameterized SQL
- [B] backend/app/schemas/note.py: `NoteCreate` (trimmed, min length 1) and `NoteResponse` request/response schemas
- [B] backend/app/services/note_service.py: `create_note` / `list_notes` business logic between router and repository
- [B] backend/app/routers/notes.py: `POST /api/notes` (201) and `GET /api/notes` (200) endpoints
- [B] backend/tests/unit/test_note_service_unit.py: service-layer unit tests with a mocked repository
- [B] backend/tests/integration/test_notes_integration.py: full HTTP round-trip tests against real PostgreSQL
- [A] frontend/src/api/notes.ts: typed API client (`Note`, `listNotes`, `createNote`) on native fetch
- [A] frontend/src/components/NoteForm.tsx: text input + submit button with client-side empty-note validation message
- [A] frontend/src/components/NoteList.tsx: list rendering of saved notes
- [A] frontend/src/components/NoteForm.test.tsx: Vitest tests for validation message, no-call-on-empty, and successful submit
- [A] frontend/src/components/NoteList.test.tsx: Vitest tests for empty and populated list rendering
- [D] e2e/tests/TEST-03_simple_note_form.spec.ts: Playwright spec covering all three criteria plus the whitespace edge case
- [G] e2e/uat/scenarios/TEST-03_simple_note_form.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md: manual step-by-step UAT clickthrough with pass/fail checkboxes
- [G] .claude/artifacts/TEST-03/uat_script.md: the copy of the manual script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: register the notes router, add CORSMiddleware, add the lifespan schema init (skipped when `DATABASE_URL` is unset)
- [B] backend/app/core/config.py: add the `cors_origins` setting (default `["http://localhost:5173"]`)
- [B] backend/pyproject.toml: add the `psycopg[binary]` dependency
- [B] backend/uv.lock: lockfile regenerated by the dependency change above
- [B] backend/tests/conftest.py: add real-database fixtures (module-scoped connection from `DATABASE_URL`, schema ensure, per-test notes cleanup) alongside the existing client fixture
- [A] frontend/src/components/LandingPage.tsx: hold notes state, load once on mount, render NoteForm and NoteList inside the existing main
- [A] frontend/src/components/LandingPage.test.tsx: cover the new form/list composition with the API client mocked
- [A] frontend/tsconfig.json: add "vite/client" to compilerOptions.types so `import.meta.env` typechecks
- [Docs] docs/DEVELOPMENT.md: "Running tests locally" and environment notes gain the new psycopg dependency and the fact that the backend suite now needs the compose `db` service (integration tests hit real PostgreSQL)

`README.md` needs no edit: the run configuration is unchanged (`docker compose up` already starts the `db` service and `.env.example` already carries `DATABASE_URL` and `VITE_API_BASE_URL`), so only `docs/DEVELOPMENT.md` meets build-feature Section 15's condition. No other dependency manifest changes, so `backend/uv.lock` above is the only lockfile this feature regenerates (`frontend/package.json` and the root `package.json` are untouched).

## Testing Strategy
- Unit tests: service layer with the repository mocked (`testing_standards.md` Section 1.1): `create_note` happy path, whitespace-trimming edge case, and a repository-error propagation case; `list_notes` happy path and empty-list edge. Frontend: Vitest component tests colocated per the existing `*.test.tsx` convention — NoteForm (message shown and **no client call** on empty/whitespace submit; successful submit calls the client, clears the input, fires `onCreated`), NoteList (empty and populated), LandingPage (notes load on mount, new note appears after submit, existing title/footer intact) with `frontend/src/api/notes.ts` mocked.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle against real PostgreSQL (`testing_standards.md` Section 1.2): `POST /api/notes` 201 then `GET /api/notes` returns it (insert + retrieve round-trip, which also covers criterion 3's persistence claim at the API layer); 422 for empty text; 422 for whitespace-only text; `GET` returns `[]` on a clean table. Isolation: the conftest fixture truncates `notes` per test; tests are order-independent.
  - Directory: backend/tests/integration/
- E2E tests: Playwright against http://localhost:5173 covering all three criteria plus the whitespace edge case (see the outline below). Deterministic data: each spec submits a unique note text (timestamp-suffixed) so specs are independent and parallel-safe; locators use `data-testid` per the precedence rule.
  - Directory: e2e/tests/
  - File: TEST-03_simple_note_form.spec.ts
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one whitespace edge-case scenario (`testing_standards.md` Section 4), and the manual clickthrough script; interaction assertions are not duplicated from the E2E spec.
  - Directory: e2e/uat/scenarios/ (scripts in e2e/uat/scripts/)

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Non-empty note stored via `POST /api/notes`, appears in the list without a full page reload | Fill `note-input` with a unique text, click `note-submit`, await the POST response (201), assert the text appears in `note-list` while `page.url()` is unchanged and no navigation occurred | Given the landing page is open, When I type "Buy milk" and press the submit button, Then "Buy milk" appears in the notes list without the page reloading |
| 2 | Empty note rejected with a visible validation message and no API call | With `note-input` empty, click `note-submit`; assert `note-form-error` is visible; record requests via `page.on("request")` and assert no request to `/api/notes` was made | Given the landing page is open, When I press submit with the note field empty, Then I see a validation message and no request is sent to the backend |
| 3 | Saved notes persist across a page reload | Submit a unique note, `page.reload()`, assert the note is still shown in `note-list` (served by `GET /api/notes` from PostgreSQL) | Given I saved a note, When I reload the page, Then that note is still shown in the list |
| edge | Whitespace-only note treated as empty | Fill `note-input` with spaces only, click `note-submit`; assert `note-form-error` visible and no `/api/notes` request | Given the landing page is open, When I submit a note containing only spaces, Then I see the validation message and nothing is saved |
