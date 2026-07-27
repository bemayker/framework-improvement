# Implementation Plan, TEST-03: Simple note form

## Feature
> Add a minimal note form to the landing page: a text input and a submit button that stores the note via the backend in PostgreSQL and shows the saved notes in a list. Deliberately trivial; exercises the fullstack slice (frontend, API, database) of the framework lifecycle.

(Source: `docs/issues/TEST-03.md` — Work Item Source is `hybrid` and TEST-03 is a **local** item, so its file is authoritative. `depends_on: [TEST-01]`, `scaffold: false`, branch `feature/TEST-03-simple-note-form`.)

## Acceptance Criteria
- [ ] AC1 — Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload.
- [ ] AC2 — Submitting an empty note is rejected with a visible validation message and no API call.
- [ ] AC3 — Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL).

## Plan Overview

TEST-03 is the first item to open a database connection, so it delivers the full vertical slice for exactly one resource: **notes**.

- **Backend** — the layered packages TEST-01 created empty get their first real occupants: `models/` (SQLAlchemy `Note`), `repositories/` (`NoteRepository`), `services/` (`NoteService`, owning the transaction boundary and the "content must not be empty" business rule), `schemas/` (`NoteCreate` / `NoteRead`), `routers/` (`POST|GET /api/notes`). `core/` gains the engine/session module and the `AppException` base plus a global handler. `app/main.py` registers the router, the exception handler, and CORS for the frontend origin.
- **Frontend** — a `notesApi` client module plus three components (`NoteForm`, `NoteList`, `NotesSection`) mounted into the existing `LandingPage`. State is plain `useState`/`useEffect`; no state library, no router.
- **Persistence** — PostgreSQL through the `db` service already in `docker-compose.yml`. Table creation is `Base.metadata.create_all()` on app startup (see Assumption A1); no migration tool is introduced.

Scope is held to the three criteria (`user_story_alignment.md`, `CLAUDE.md` → "Keep every feature as small as possible"): **no** note editing, deleting, pagination, sorting controls, users/auth, optimistic UI, or toast system. Project Mode is `greenfield`, but TEST-01's conventions are already on disk and are followed rather than reinvented: inline `CSSProperties` style objects (no CSS framework is configured), `data-testid="{component}-{element}"`, `create_app()` factory left intact, `test_{module}_unit.py` / `test_{module}_integration.py` naming, dataclass-based settings read from the environment.

## Frontend Plan

- **Components to create**
  - `frontend/src/components/NoteForm.tsx` — molecule: labelled text input + submit button. Trims the input; on empty/whitespace-only input it renders a visible validation message and **does not** call its `onSubmit` prop (AC2 — the API call is prevented here, before any network work). Clears the input on a successful submit and clears the error on the next valid attempt. Test ids: `note-form`, `note-form-input`, `note-form-submit`, `note-form-error`.
  - `frontend/src/components/NoteList.tsx` — molecule: renders a semantic `<ul>` of notes, newest last (insertion order, Assumption A4), plus an empty state. Test ids: `note-list`, `note-list-empty`, `note-list-item-{id}`.
  - `frontend/src/components/NotesSection.tsx` — organism: owns the state (`notes`, `error`, `isLoading`, `isSubmitting`), loads notes once on mount via `fetchNotes()`, and on submit calls `createNote(content)` and appends the returned note to state (no refetch, no navigation — AC1's "without a full page reload"). Renders an error message when a request fails. Test ids: `notes-section`, `notes-error`.
  - `frontend/src/api/notesApi.ts` — the single place that talks HTTP (`coding_standards.md` §4 client layer): exported `Note` type (`id`, `content`, `created_at`), `fetchNotes()`, `createNote(content)`. Base URL from `import.meta.env.VITE_API_BASE_URL` with the `http://localhost:8000` fallback already used by `.env.example` / `docker-compose.yml`. Non-2xx responses and network failures throw an `Error` with a human-readable message; no `any` types.
  - `frontend/src/vite-env.d.ts` — `/// <reference types="vite/client" />`, required for `import.meta.env` to typecheck under `tsc -b` (the current `tsconfig.json` `types` array does not include `vite/client`).
- **Components to modify**
  - `frontend/src/components/LandingPage.tsx` — render `<NotesSection />` inside the existing `<main>`. `data-testid="landing-page"` and `data-testid="landing-title"` and the `Task Notes` heading stay byte-identical (TEST-01's Vitest and E2E specs assert them). The container switches from vertically centred to top-aligned with the same padding so the form and list have room.
- **Routes:** none. Single page at `/`.
- **State management:** `useState` + `useEffect` in `NotesSection` only (`coding_standards.md` §3.3 — native APIs first). No Context, no store.
- **Design reference notes:** Design Reference mode is `NONE` → AI freestyle, matching TEST-01's existing look: system font stack, `#1a1a1a` text, `#5f5f5f` secondary, inline `CSSProperties` objects, mobile-first single column, semantic `<form>`/`<ul>`/`<li>`, `aria-label` on the input, validation message wired to the input via `aria-describedby` and rendered with `role="alert"`.

## Backend Plan

- **Endpoints**
  - `POST /api/notes` — create a note. 201 with the created note.
  - `GET /api/notes` — list all notes. 200 with an array.
- **Router layer** (`app/routers/notes.py`): `APIRouter(prefix="/api/notes", tags=["notes"])`, request/response validation through the schemas, session injected with a `Depends(get_db)` dependency. No business logic.
- **Service layer** (`app/services/note_service.py`): `NoteService` wrapping a `NoteRepository`.
  - `create_note(content: str) -> Note` — strips the content, raises `EmptyNoteError` when the result is empty (the business rule, see Assumption A3), delegates the insert to the repository, and **commits** — the transactional boundary lives here.
  - `list_notes() -> list[Note]` — delegates to the repository.
- **Repository layer** (`app/repositories/note_repository.py`): `NoteRepository` over a SQLAlchemy `Session`.
  - `add(content: str) -> Note` — `session.add` + `flush` so the generated `id`/`created_at` are populated; no commit (that is the service's).
  - `list_all() -> list[Note]` — `select(Note).order_by(Note.id)`.
- **Model** (`app/models/note.py`): `Note` on the shared `Base` (`app/models/base.py`, a `DeclarativeBase` subclass) — table `notes`; `id` integer primary key; `content` `Text`, not null (no invented length cap, Assumption A6); `created_at` `DateTime(timezone=True)`, not null, `server_default=func.now()`.
- **Schemas** (`app/schemas/note.py`): `NoteCreate` (`content: str`) and `NoteRead` (`id: int`, `content: str`, `created_at: datetime`, `model_config = ConfigDict(from_attributes=True)`).
- **Core**
  - `app/core/db.py` — engine built from the settings' `database_url` with the scheme normalized to `postgresql+psycopg://` (Assumption A2), a `sessionmaker`, the `get_db()` FastAPI dependency (yields a session, always closes it), and `init_db()` which imports the models and runs `Base.metadata.create_all(bind=engine)`.
  - `app/core/exceptions.py` — `AppException(Exception)` base plus `EmptyNoteError(AppException)` (`coding_standards.md` §2.3).
  - `app/core/config.py` (modified) — keep `app_title` and `database_url`, drop the now-stale "unused until TEST-02" comments, and add `frontend_origin: str` from `FRONTEND_ORIGIN` (default `http://localhost:5173`) for the CORS allowlist.
- **`app/main.py`** (modified) — inside the existing `create_app()` factory, and without restructuring it: add a `lifespan` that calls `init_db()` on startup, add `CORSMiddleware` limited to `settings.frontend_origin` (the browser calls `:8000` from `:5173`, so this is required, not optional — Assumption A8), register an `AppException` handler returning `{"detail": "<message>"}` with HTTP 400, and `include_router(notes.router)`.
- **Logging:** module-level `logging.getLogger(__name__)` in the service and the exception handler; the handler logs the rejected request with context. No `print()`.
- **Migrations:** none — no Alembic (Assumption A1). `init_db()` is the schema step, called at app startup and by the integration-test fixture.
- **Dependencies:** add `sqlalchemy>=2.0.35` and `psycopg[binary]>=3.2` to `backend/pyproject.toml` via `uv add` so `backend/uv.lock` is regenerated — `backend/Dockerfile` runs `uv sync --frozen` and fails on a stale lock.

## API Integration Plan
No external API integration. `CLAUDE.md` lists no API References; `notesApi.ts` consumes this project's own backend.

## API Contract

### `POST /api/notes`
- **Method:** POST
- **URL:** `/api/notes`
- **Request:** `{ "content": string }`

```json
{ "content": "Buy milk" }
```

- **201 Created:**

```json
{ "id": 1, "content": "Buy milk", "created_at": "2026-07-27T10:15:00+00:00" }
```

- **400 Bad Request** (empty or whitespace-only content, from `EmptyNoteError`):

```json
{ "detail": "Note content must not be empty." }
```

- **422 Unprocessable Entity** — FastAPI/pydantic default when `content` is missing or not a string.

### `GET /api/notes`
- **Method:** GET
- **URL:** `/api/notes`
- **Request:** no body, no query parameters.
- **200 OK** (insertion order, oldest first; `[]` when none exist):

```json
[
  { "id": 1, "content": "Buy milk", "created_at": "2026-07-27T10:15:00+00:00" },
  { "id": 2, "content": "Call the dentist", "created_at": "2026-07-27T10:16:30+00:00" }
]
```

### Frontend consumption
`notesApi.ts` calls `${VITE_API_BASE_URL}/api/notes` with `GET` and with `POST` + `Content-Type: application/json`. It maps a non-2xx response or a thrown network error to an `Error`; `NotesSection` renders that message in `notes-error`.

## File Manifest

### New files

**Backend**
- `backend/app/core/db.py`: engine, `sessionmaker`, `get_db()` dependency, `init_db()` (`create_all`), `postgresql://` → `postgresql+psycopg://` normalization.
- `backend/app/core/exceptions.py`: `AppException` base + `EmptyNoteError`.
- `backend/app/models/base.py`: `Base(DeclarativeBase)`.
- `backend/app/models/note.py`: `Note` ORM model, table `notes` (`id`, `content`, `created_at`).
- `backend/app/schemas/note.py`: `NoteCreate`, `NoteRead`.
- `backend/app/repositories/note_repository.py`: `NoteRepository.add()`, `.list_all()`.
- `backend/app/services/note_service.py`: `NoteService.create_note()`, `.list_notes()`; empty-content rule; commit boundary.
- `backend/app/routers/notes.py`: `APIRouter` with `POST` and `GET` on `/api/notes`.
- `backend/tests/unit/test_note_service_unit.py`: service unit tests against a fake repository.
- `backend/tests/integration/test_note_repository_integration.py`: repository against real PostgreSQL.
- `backend/tests/integration/test_notes_router_integration.py`: both endpoints through the full HTTP cycle.

**Frontend**
- `frontend/src/api/notesApi.ts`: typed notes API client (`Note`, `fetchNotes`, `createNote`).
- `frontend/src/vite-env.d.ts`: `vite/client` type reference for `import.meta.env`.
- `frontend/src/components/NoteForm.tsx`: input + submit + client-side empty validation.
- `frontend/src/components/NoteForm.test.tsx`: Vitest tests for the form.
- `frontend/src/components/NoteList.tsx`: notes list + empty state.
- `frontend/src/components/NoteList.test.tsx`: Vitest tests for the list.
- `frontend/src/components/NotesSection.tsx`: organism owning state, load-on-mount, submit.
- `frontend/src/components/NotesSection.test.tsx`: Vitest tests with `notesApi` mocked.

**E2E / UAT**
- `e2e/tests/TEST-03_simple_note_form.spec.ts`: browser specs for AC1–AC3 plus an edge case.
- `e2e/uat/scenarios/TEST-03_simple_note_form.feature`: Gherkin, one scenario per criterion plus an edge case.
- `e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md`: manual clickthrough script.

### Modified files
- `backend/app/main.py`: `lifespan` calling `init_db()`, `CORSMiddleware` for `settings.frontend_origin`, `AppException` handler (400), `include_router(notes.router)`. The `create_app()` factory shape is preserved.
- `backend/app/core/config.py`: add `frontend_origin`; refresh the TEST-01 comments that say the DB URL is unused.
- `backend/pyproject.toml`: add `sqlalchemy` and `psycopg[binary]` (via `uv add`).
- `backend/uv.lock`: regenerated by `uv add` — required, `backend/Dockerfile` uses `uv sync --frozen`.
- `backend/tests/conftest.py`: add a module-scoped `db_engine` fixture (URL from `DATABASE_URL`, falling back to the `.env.example` dev default, running `create_all` once), a function-scoped `db_session` fixture bound to a connection-level transaction that is rolled back after each test, and change the existing `client` fixture from session- to function-scoped with `app.dependency_overrides[get_db]` returning that session. No current test uses `client`, so repurposing it is safe and avoids a second near-duplicate fixture.
- `backend/tests/unit/test_main_unit.py`: `test_create_app_registers_no_feature_routes` **will fail** once the notes router is registered — rewrite it as `test_create_app_registers_notes_routes` asserting `/api/notes` is present. This is a required change, not optional.
- `frontend/src/components/LandingPage.tsx`: render `<NotesSection />` in `<main>`; keep `landing-page` / `landing-title` and the heading text unchanged; top-align the container.
- `frontend/src/components/LandingPage.test.tsx`: mock `../api/notesApi` so the existing three assertions keep passing without a network call from the newly mounted `NotesSection`.
- `.env.example`: document `FRONTEND_ORIGIN=http://localhost:5173` (the CORS allowlist).
- `.github/workflows/pr-tests.yml`: **no change required** — verified against this plan. `docker compose up -d` waits for the `db` healthcheck before the backend starts, so PostgreSQL is reachable on `localhost:5432` for the integration step, and `npx playwright test` runs against the compose-served frontend on `:5173`. Touch this file only if a concrete command turns out to differ.
- `docker-compose.yml`: **no change required** — `db`, `DATABASE_URL`, and `VITE_API_BASE_URL` are already wired by TEST-01.

## Testing Strategy

- **Unit tests** — the service layer's business logic (the only new business logic): `NoteService.create_note` happy path (content stored trimmed, repository called once, commit issued), edge case (surrounding whitespace trimmed; `list_notes` returns `[]` when the repository is empty), error case (`""` and `"   "` raise `EmptyNoteError` and the repository is **not** called). Repository is a hand-rolled fake/stub — no database (`testing_standards.md` §1.1). Frontend: `NoteForm` (renders; empty submit shows `note-form-error` and `onSubmit` is not called; valid submit passes the trimmed content and clears the input), `NoteList` (renders items with stable test ids; empty state), `NotesSection` (with `notesApi` mocked: loads on mount, appends the created note without refetching, surfaces a failed create in `notes-error`).
  - Directory: `backend/tests/unit/`, naming `test_{module}_unit.py`; frontend tests colocated as `*.test.tsx` (TEST-01's convention).
- **Integration tests** — ENABLED per `CLAUDE.md`. Repository against real PostgreSQL: add + list round-trip, empty result set, insertion ordering, and `created_at` populated by the server default. Router through the full HTTP cycle: `POST` 201 with the created body, `GET` 200 returning previously created notes, `POST {"content": "   "}` → 400 with the `detail` message, `POST {}` → 422. Isolation is per-test transaction rollback via the `db_session` fixture (`testing_standards.md` §1.2).
  - Directory: `backend/tests/integration/`, naming `test_{module}_integration.py`.
- **E2E tests** — ENABLED. One spec file covering all three criteria against the compose stack, using a unique note text per run (`Date.now()`/`randomUUID()`) because the sandbox database is not reset between specs, which also keeps specs independent and parallel-safe (`testing_standards.md` §1.3). Locators are `data-testid` only. No hardcoded waits — Playwright web-first assertions.
  - Directory: `e2e/tests/`
  - File: `TEST-03_simple_note_form.spec.ts`
- **UAT scenarios** — ENABLED. One Gherkin scenario per acceptance criterion plus one edge-case scenario (whitespace-only note rejected), and a manual script in TEST-01's table format (prerequisites → `docker compose up --build` → numbered steps with pass/fail boxes).
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

## Acceptance Test Outline

| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Non-empty note is stored via `POST /api/notes` and appears in the list without a full page reload | `goto('/')`; fill `note-form-input` with a unique text; click `note-form-submit`; `expect(page.getByTestId('note-list')).toContainText(text)`; assert no navigation happened (a `page.on('framenavigated')` counter stays at the initial load) and that a `POST /api/notes` request was observed via `page.waitForResponse` returning 201 | Given the app is running and the note list is visible, When I type "Buy milk" and click Save, Then "Buy milk" appears in the note list without the page reloading |
| 2 | Empty note is rejected with a visible validation message and no API call | `goto('/')`; register `page.route('**/api/notes', ...)` counting POSTs; click `note-form-submit` with the input empty; `expect(page.getByTestId('note-form-error')).toBeVisible()`; assert the POST counter is 0 and the list is unchanged | Given the note form is empty, When I click Save without typing anything, Then a validation message is shown and no note is added |
| 3 | Saved notes persist across a page reload (`GET /api/notes` reads them from PostgreSQL) | Submit a unique note; `page.reload()`; `await expect(page.getByTestId('note-list')).toContainText(text)` after the `GET /api/notes` response | Given I saved the note "Call the dentist", When I reload the page, Then "Call the dentist" is still listed |
| — | Edge case (not an AC; covers the server-side guard) | Submit a whitespace-only note (`"   "`): the client-side guard shows `note-form-error` and issues no request; the equivalent server behaviour (400) is covered by the router integration test, not the browser | Given the note form contains only spaces, When I click Save, Then a validation message is shown and no note is added |

## Assumptions and Decisions

Recorded per `user_story_alignment.md` §2/§4 — each is a reasonable inference, none blocks the build.

- **A1 — No migration tool.** Alembic is not introduced. `Base.metadata.create_all()` runs from the app's `lifespan` on startup and from the integration-test `db_engine` fixture. Rationale: the item is explicitly a trivial sandbox slice, `CLAUDE.md` names no migration tool, and adding one would be gold plating. Revisit when a schema change needs to be versioned.
- **A2 — psycopg3 driver, scheme normalized in code.** `psycopg[binary]` is used and `app/core/db.py` rewrites a `postgresql://` URL to `postgresql+psycopg://`. This keeps `.env.example` and `docker-compose.yml` (both already carrying `postgresql://…`) untouched, which also shrinks the conflict surface with TEST-02.
- **A3 — Empty content is a 400, not a 422.** Emptiness is a business rule and lives in the service (`coding_standards.md` §2.2 keeps logic out of the router and schemas), so `""` and `"   "` both surface as `400 {"detail": "Note content must not be empty."}` through the `AppException` handler. Only type/shape errors produce pydantic 422s. Consistent single code for one rule.
- **A4 — Ordering is insertion order.** `GET /api/notes` returns notes ordered by `id` ascending (oldest first, newest appended at the bottom of the list). The criteria say nothing about ordering; a deterministic order is required for tests, and no sorting controls are added.
- **A5 — Notes are global.** No user, tenant, or auth scoping: nothing in the item mentions users, and the project has no auth.
- **A6 — Note fields are `id`, `content`, `created_at` only.** `content` is `Text` with no length cap (a cap would be an invented constraint). No `updated_at`, no title, no tags. No `PUT`/`DELETE` endpoints — not in the criteria.
- **A7 — AC2's "no API call" is enforced client-side.** `NoteForm` blocks the submit before `notesApi` is reached; the server-side guard is defence in depth and is verified by the router integration test rather than the browser spec.
- **A8 — CORS is required.** The browser serves the app from `:5173` and calls the API on `:8000`, so `CORSMiddleware` with an allowlist of `settings.frontend_origin` (`FRONTEND_ORIGIN`, default `http://localhost:5173`) is a functional necessity, not an extra. A Vite dev-server proxy was the alternative but would require editing `docker-compose.yml` (the container cannot reach `http://localhost:8000` from inside), so CORS is the smaller change.
- **A9 — Integration-test database URL.** `backend/tests/conftest.py` reads `DATABASE_URL` from the environment and falls back to the dev default already published in `.env.example` (`postgresql://tasknotes:tasknotes@localhost:5432/tasknotes`) so that both `cd backend && uv run pytest` on a developer machine and the CI step (which sets no env var of its own) work against `docker compose up`. This is a conscious, documented deviation from `testing_standards.md` §5's "no hardcoded connection strings": the value is a non-secret local default that already exists in two committed files, and keeping it in one test-config place avoids also editing `.github/workflows/pr-tests.yml`.
- **A10 — The scaffold's "TEST-02 introduces the DB layer" comments are stale.** `backend/app/core/config.py` and `backend/tests/conftest.py` predict that TEST-02 lands DB connectivity. TEST-02 is a health endpoint and is *independent* of TEST-03, so TEST-03 must not wait for it: this plan introduces the DB layer itself and updates those comments. See `shared_risks.md` — whichever of the two merges second has to rebase onto the other's `main.py`/`conftest.py`.
