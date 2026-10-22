# Refactor report: BUG-04

Result: 2 improvements applied (3 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/NoteForm.test.tsx | Deferred-promise setup duplicated in two tests | DRY violations | RECOMMENDED | Extracted `pendingSave()` helper |
| 2 | e2e/tests/BUG-04_double_submit_note.spec.ts | `waitForResponse` predicates for GET load and POST 201 each repeated | DRY violations | RECOMMENDED | Extracted `waitForNotesLoad` and `waitForNoteCreated` |

NoteForm.tsx: no findings. No files created.
