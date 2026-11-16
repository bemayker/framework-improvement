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
- backend/app/: FastAPI app — routers/, services/, repositories/, schemas/ (Pydantic), models/, core/ (config, db), main.py (app and router registration)
- backend/tests/: pytest — unit/ and integration/, shared fixtures in conftest.py
- frontend/src/: React + TypeScript (Vite) — components/ (one component per file, co-located *.test.tsx), api/ (fetch clients)
- e2e/: Playwright specs in tests/, helpers/, UAT scenarios and scripts in uat/

## Naming
- Python module: snake_case, layer suffix (backend/app/services/note_service.py, repositories/note_repository.py)
- Python class: PascalCase (NoteRepository, NoteRepositoryProtocol)
- Python function: snake_case (create_note, list_notes)
- Python test file: test_{module}_unit.py / test_{module}_integration.py (tests/unit/test_note_service_unit.py)
- React component: PascalCase file and default export (frontend/src/components/AppFooter.tsx)
- Frontend test: co-located {Name}.test.tsx / {module}.test.ts (components/NoteForm.test.tsx, api/notes.test.ts)
- E2E spec: {feature_id}_{slug}.spec.ts (e2e/tests/TEST-03_simple_note_form.spec.ts)

## Canonical modules
- router: backend/app/routers/notes.py
- service: backend/app/services/note_service.py
- repository: backend/app/repositories/note_repository.py
- schema: backend/app/schemas/note.py
- component: frontend/src/components/NoteForm.tsx
- API client: frontend/src/api/notes.ts
- test: backend/tests/unit/test_note_service_unit.py, backend/tests/integration/test_notes_integration.py

## Documentation convention
- Python: module docstring naming the work item and the design reason; one-line docstring on every public class and function
- TypeScript: no JSDoc; components and clients carry no doc comments
