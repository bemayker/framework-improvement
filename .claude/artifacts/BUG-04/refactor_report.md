# Refactor report: BUG-04

Result: 1 improvements applied (3 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/NoteForm.test.tsx | Pending-save promise setup duplicated in three tests | DRY violations | RECOMMENDED | Extracted holdSave() helper (applied) |

Files examined: frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts. No files created.

Not applied (review OPTIONAL, goes to PR known improvements): double-submit tests wrap fireEvent in act, so a state-only fix would also pass; nothing isolates the useRef guard.
