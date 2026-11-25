# Refactor report: BUG-04

Files examined: 2 (frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/NoteForm.test.tsx | Two tests repeat the same 6-line deferred-promise setup for a hanging createNote | DRY violations | RECOMMENDED | Extract a holdNextSave helper in the test file (applied) |

NoteForm.tsx: no findings. Behaviour unchanged; no new files created.

Result: 1 improvements applied (2 files examined)
