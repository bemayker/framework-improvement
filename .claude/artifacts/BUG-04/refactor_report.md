# Refactor report: BUG-04 (gate, run deliver-20261017T183944Z)

Outcome: 3 improvements applied (6 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/NoteForm.test.tsx | Review RECOMMENDED 1: the submittingRef guard was not exercised, the existing double-submit test passes on the disabled attribute alone | Review finding | RECOMMENDED | Added a test that fires submit twice on the form while createNote is pending and asserts one call. Modification of an existing file, no file created. |
| 2 | e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md, .claude/artifacts/BUG-04/uat_script.md | Review RECOMMENDED 2: step 10 blocks localhost:8000, the backend is on 8010 | Review finding | RECOMMENDED | Changed to localhost:8010/api/notes in both copies, which are identical. |
| 3 | same two UAT files | Review OPTIONAL: prerequisite says steps 2 to 7 need the Network tab, steps 2 to 12 do | Review finding | OPTIONAL (applied, same lines, in scope) | Changed to steps 2 to 12. |

## Verification of RECOMMENDED 1
- With the guard: `npm --prefix frontend test -- src/components/NoteForm.test.tsx` 11 passed.
- With lines 82-84 of NoteForm.tsx temporarily removed: 1 failed, 10 passed (the new test: expected spy to be called 1 times, got 2). Guard restored; `git diff` on NoteForm.tsx is empty.

## Checklist pass over the other changed files
NoteForm.tsx, BUG-04 E2E spec: no naming, DRY, dead-code, complexity, layering or import findings.

## Tests after the gate
`npm --prefix frontend test`: 5 files, 31 passed, 0 failed. No backend code changed.

## Files created by the gate
None.
