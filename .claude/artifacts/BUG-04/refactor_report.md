# Refactor report: BUG-04

Result: 1 improvements applied (3 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/NoteForm.test.tsx | The deferred-save promise setup was repeated in two tests | DRY violations | RECOMMENDED | Extracted to a local `holdNextSave` helper (applied) |

Files examined: frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts.

Review findings carried: the OPTIONAL one (Enter-twice E2E test lacks the reload check) goes to known improvements.

Tests after change: frontend vitest 38 passed, 0 failed.
