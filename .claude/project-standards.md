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
- backend/app/: FastAPI app (main.py) with layers core/ (config, db), routers/, services/, repositories/, schemas/, models/
- backend/tests/: pytest suites, unit/ and integration/, shared fixtures in conftest.py
- frontend/src/: React + TypeScript (Vite); components/, api/ (fetch clients), tests beside their module
- e2e/: Playwright specs in tests/, Gherkin UAT scenarios and manual scripts under uat/
- docs/: project docs and local work items (docs/issues/)

## Naming
- Backend module: note_service.py; class: NoteRepository; function: get_connection; test file: test_note_service_unit.py
- Frontend component: NoteForm.tsx with NoteForm.test.tsx beside it; API client: api/notes.ts
- E2E spec: TEST-03_simple_note_form.spec.ts

## Canonical modules
- Router: backend/app/routers/notes.py
- Service: backend/app/services/note_service.py
- Repository: backend/app/repositories/note_repository.py
- Schema: backend/app/schemas/note.py
- Component: frontend/src/components/NoteForm.tsx
- Backend test: backend/tests/unit/test_note_service_unit.py

## Documentation convention
- Backend modules open with a module docstring naming the work item and the design reason; frontend files use short comments explaining why, no JSDoc
