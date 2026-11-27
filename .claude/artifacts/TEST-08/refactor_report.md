# Refactor report: TEST-08

Result: 2 improvements applied (4 files examined)

Scope: the feature's changed files; examined AppFooter.tsx, AppFooter.test.tsx, notes.ts, version.ts.

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/api/notes.ts | Import of ./baseUrl sat below the Note type (review RECOMMENDED 1) | Import hygiene | RECOMMENDED | Moved the import to line 1. Applied. |
| 2 | frontend/src/components/AppFooter.test.tsx | Failure and unresolvable tests waited only for the fetch call (review RECOMMENDED 2) | Naming and structure | RECOMMENDED | Wait through a named `settlePendingPromises` helper (`await act(async () => {})`). Applied. |

## Deliberate break (finding 2)

Break: catch handler temporarily set to `.catch(() => { if (isMounted) setVersion("undefined"); })`, reverted before the commit.

- Before the change: the "request fails" test already FAILED (`expected 'Task Notes vundefined' to be 'Task Notes'`, 1 failed, 6 passed). The reviewer's predicted gap did not exist, because RTL's `waitFor` flushes the rejected promise before returning.
- After the change: the same test FAILED the same way (1 failed, 6 passed). The change makes the settle explicit instead of relying on `waitFor`'s implicit flush, so the check no longer depends on that behaviour.

No production code changed.
