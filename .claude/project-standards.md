# Project standards

Derived by `/sync-project` from this repository's own configuration (`hooks/lib/project-standards.sh`); a re-run re-derives every section. The one hand setting is the docstring switch below. Every builder dispatch reads this file in its handover.

## Gate

Run on every commit by `hooks/standards-gate.sh`, on the changed files each row covers, from the row's folder. A failing row refuses the commit: fix what the tool names and commit again. These are this repository's tools; the framework adds none.

| Check | Folder | Files | Command |
|---|---|---|---|
| lint | backend | *.py | `uv run ruff check` |
| docstrings | backend | *.py | `uv run ruff check --select D101,D102,D103` |

## Docstrings

- Docstring rule: on
- Public functions, methods and classes carry a docstring (JSDoc in JavaScript and TypeScript), checked by the `docstrings` rows above. Set the rule to `off` here to stop them for this project.

## Test runner

- Test gate command (from `CLAUDE.md`): uv run --directory backend pytest -q && npm --prefix frontend test. The test gate runs it before every push; this file adds nothing to it.

## Layout
- backend/app/: FastAPI app, layered as routers/ (HTTP), services/ (logic), repositories/ (SQL via psycopg), schemas/ (Pydantic), models/ (records), core/ (config.py, db.py); main.py registers routers
- backend/tests/: unit/ and integration/ pytest suites, shared fixtures in conftest.py
- frontend/src/: React + Vite; components/ (UI, test beside each), api/ (fetch clients, test beside each)
- e2e/tests/: Playwright specs; e2e/uat/: Gherkin scenarios and manual scripts

## Naming
- Python module: backend/app/services/note_service.py (snake_case, layer suffix)
- Python class: NoteRepository, NoteRepositoryProtocol (PascalCase)
- Python function: create_note, get_note_repository (snake_case)
- Backend test file: backend/tests/unit/test_note_service_unit.py, backend/tests/integration/test_notes_integration.py
- React component: frontend/src/components/NoteForm.tsx with NoteForm.test.tsx beside it
- E2E spec: e2e/tests/TEST-03_simple_note_form.spec.ts

## Canonical modules
- router: backend/app/routers/notes.py
- service: backend/app/services/note_service.py
- repository: backend/app/repositories/note_repository.py
- schema: backend/app/schemas/note.py
- component: frontend/src/components/NoteForm.tsx
- api client: frontend/src/api/notes.ts
- test: backend/tests/unit/test_note_service_unit.py, frontend/src/components/NoteForm.test.tsx

## Documentation convention
- Python: a module docstring naming the work item that introduced it, and a one-line docstring on every public function, class and Protocol method
- TypeScript: no JSDoc convention observed
