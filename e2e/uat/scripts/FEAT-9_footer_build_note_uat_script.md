# UAT script, FEAT-9: footer shows a build note

Feature: the page footer renders the one-line text `Build note` below the existing app identity line.
Branch: `feature/FEAT-9-footer-build-note`

## Criterion 1: The page footer renders the one-line text `Build note`

Prerequisites:
- The app stack is running (`docker compose up` from the repository root).
- The frontend answers at `http://localhost:5183`.
- A desktop browser with DevTools.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1 | Open `http://localhost:5183/` | The landing page shows the heading `Task Notes`, the note form and the note list | [ ] | [ ] |
| 2 | Scroll to the bottom of the page | The footer shows a first line `Task Notes v{version}` (followed by `({7-character commit})` when the backend reports a commit) and, on its own line directly below it, the text `Build note`, in the same small grey footer text | [ ] | [ ] |
| 3 | Right-click `Build note` and choose Inspect | The element is `<div data-testid="app-footer-build-note">Build note</div>` inside `<footer data-testid="app-footer">` | [ ] | [ ] |
| 4 | Edge case: in DevTools, Network, block the request URL `/api/version`, then reload `http://localhost:5183/` | The footer's first line reads only `Task Notes`, `Build note` is still shown on the line below, and no `undefined`, `null` or `unknown` appears anywhere in the footer | [ ] | [ ] |
| 5 | Unblock `/api/version` in DevTools | The browser is left as it was | [ ] | [ ] |

## Criterion 2: `npm --prefix frontend test` passes

Prerequisites:
- The repository is checked out on `feature/FEAT-9-footer-build-note`.
- Frontend dependencies are installed (`npm --prefix frontend install`).
- This criterion is verified in a terminal, not in the UI.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1 | From the repository root, run `npm --prefix frontend test` | Vitest runs every frontend test file, including `src/components/AppFooter.test.tsx` and `src/components/LandingPage.test.tsx` | [ ] | [ ] |
| 2 | Read the summary at the end of the output | 0 failed, and the command exits with status 0 | [ ] | [ ] |
| 3 | Read the `AppFooter.test.tsx` block in the output | The build-note tests (`renders the build note on its own line in the footer`, `renders the build note when the version request fails`) are listed as passed | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed | Result |
|---|---|---|---|---|
| 1. Footer renders `Build note` | 5 | | | |
| 2. `npm --prefix frontend test` passes | 3 | | | |

Tester: ______________  Date: ______________  Overall result: [ ] Pass  [ ] Fail
