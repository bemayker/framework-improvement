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
- backend/app/: FastAPI app, layered as routers/, services/, repositories/, schemas/ (Pydantic), models/, core/ (config, db); entry backend/app/main.py
- backend/tests/: unit/ and integration/ pytest suites, shared fixtures in conftest.py
- frontend/src/: React + TypeScript (Vite); components/ for UI, api/ for HTTP clients, tests beside the component
- e2e/: Playwright specs in tests/, Gherkin in uat/scenarios/, manual UAT scripts in uat/scripts/

## Naming
- module: backend/app/services/note_service.py (snake_case, suffixed by layer)
- class: NoteRepositoryProtocol (PascalCase)
- function: create_note (snake_case); React component: AppFooter (PascalCase, default export)
- test files: backend/tests/unit/test_note_service_unit.py, backend/tests/integration/test_notes_integration.py, frontend/src/components/NoteForm.test.tsx, e2e/tests/TEST-03_simple_note_form.spec.ts

## Canonical modules
- router: backend/app/routers/notes.py
- service: backend/app/services/note_service.py
- repository: backend/app/repositories/note_repository.py
- component: frontend/src/components/NoteForm.tsx
- api client: frontend/src/api/notes.ts
- test: backend/tests/unit/test_note_service_unit.py

## Documentation convention
- Python: module docstring naming the work item and the layer's reason, plus a one-line docstring per public function and class
- TypeScript: no JSDoc; components are self-describing with no header comment
