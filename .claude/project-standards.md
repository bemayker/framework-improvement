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
- backend/app/: FastAPI app, layered as routers/ (HTTP), services/ (logic), repositories/ (raw SQL via psycopg), schemas/ (pydantic I/O), models/ (domain objects), core/ (config, db connection)
- backend/tests/unit/ and backend/tests/integration/: pytest suites, shared fixtures in backend/tests/conftest.py
- frontend/src/: React + TypeScript (Vite); components/ for UI, api/ for backend clients, tests co-located as *.test.ts(x)
- e2e/tests/: Playwright specs; e2e/uat/: Gherkin scenarios and manual UAT scripts

## Naming
- Python module: snake_case with layer suffix, e.g. backend/app/services/note_service.py, backend/app/repositories/note_repository.py
- Python class: PascalCase, e.g. NoteRepository
- Python function: snake_case, e.g. create_note, list_notes
- React component: PascalCase file and function, default export, e.g. frontend/src/components/AppFooter.tsx
- Test files: backend/tests/unit/test_{module}_unit.py, backend/tests/integration/test_{module}_integration.py, frontend {Name}.test.tsx, e2e/tests/{ID}_{slug}.spec.ts

## Canonical modules
- router: backend/app/routers/notes.py
- service: backend/app/services/note_service.py
- repository: backend/app/repositories/note_repository.py
- component: frontend/src/components/AppFooter.tsx
- test: backend/tests/unit/test_note_service_unit.py

## Documentation convention
- Python: a module docstring naming the work item and the design reason, plus a one-line docstring on every public class and function
- TypeScript/React: no JSDoc; components are undocumented
