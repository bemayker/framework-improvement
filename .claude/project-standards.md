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
- backend/app/: FastAPI app, layered as routers/, services/, repositories/, schemas/, models/, core/ (config, db)
- backend/tests/: pytest, unit/ and integration/ with shared fixtures in conftest.py
- frontend/src/: React + Vite, components/ (with co-located *.test.tsx) and api/ (fetch clients)
- e2e/: Playwright specs in tests/, UAT scenarios and scripts in uat/

## Naming
- Module: backend/app/services/note_service.py (snake_case, {entity}_{layer}.py)
- Class: NoteRepositoryProtocol (PascalCase)
- Function: insert_note (snake_case); frontend createNote (camelCase)
- Component: frontend/src/components/NoteForm.tsx (PascalCase)
- Test file: backend/tests/unit/test_note_service_unit.py, frontend/src/components/NoteForm.test.tsx, e2e/tests/TEST-03_simple_note_form.spec.ts

## Canonical modules
- Router: backend/app/routers/notes.py
- Service: backend/app/services/note_service.py
- Repository: backend/app/repositories/note_repository.py
- Schema: backend/app/schemas/note.py
- Component: frontend/src/components/NoteForm.tsx
- API client: frontend/src/api/notes.ts
- Test: backend/tests/integration/test_notes_integration.py

## Documentation convention
- Python: a module docstring on every module stating its purpose and the item ID that introduced it, plus one-line class and function docstrings
- TypeScript: no JSDoc; short line comments explain why (for example a constant mirrored from the backend)
