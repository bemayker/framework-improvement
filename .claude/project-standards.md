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
- backend/app/: FastAPI app, layered as routers/ → services/ → repositories/, with schemas/ (Pydantic), models/ (row types) and core/ (config, db)
- backend/tests/: pytest, split into unit/ and integration/, shared fixtures in conftest.py
- frontend/src/: React + TypeScript (Vite); components/ for UI, api/ for backend clients, tests beside the file as *.test.ts(x)
- e2e/: Playwright specs in tests/, UAT Gherkin in uat/scenarios/, manual scripts in uat/scripts/

## Naming
- Python module: backend/app/services/note_service.py (snake_case, {entity}_{layer}.py)
- Python class: NoteRepositoryProtocol (PascalCase)
- Python function: create_note, list_notes (snake_case verbs)
- Python test file: backend/tests/unit/test_note_service_unit.py, backend/tests/integration/test_notes_integration.py
- React component: frontend/src/components/AppFooter.tsx (PascalCase, default export)
- Frontend test file: frontend/src/components/AppFooter.test.tsx
- E2E spec: e2e/tests/TEST-04_page_footer.spec.ts

## Canonical modules
- router: backend/app/routers/notes.py
- service: backend/app/services/note_service.py
- repository: backend/app/repositories/note_repository.py
- schema: backend/app/schemas/note.py
- component: frontend/src/components/AppFooter.tsx
- api client: frontend/src/api/notes.ts
- test: backend/tests/unit/test_note_service_unit.py

## Documentation convention
- Python: module docstring naming the work item and the why; one-line triple-quoted docstring on every public function and class
- TypeScript: no JSDoc; comments only where the why is not obvious
