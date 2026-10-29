# Implementation Plan, FEAT-9: VERIFY MDF-504: frontend footer shows a build note

## Feature
> Loop: staged for verify of MDF-504 (row 247). Frontend only: add a one-line footer text 'Build note' to the page footer in frontend/src, with a Vitest test. Acceptance: the footer renders the text; npm test passes.

## Acceptance Criteria
- [ ] The page footer renders the one-line text `Build note`.
- [ ] `npm test` (run as `npm --prefix frontend test`) passes.

## Plan Overview
Frontend only. The page footer is `frontend/src/components/AppFooter.tsx` (rendered once by `LandingPage.tsx`, which `App.tsx` renders). Add one static, unconditional line `Build note` as the last child of the existing `<footer data-testid="app-footer">`, in its own block element `<div data-testid="app-footer-build-note">Build note</div>` so it sits on its own line below the existing `Task Notes v{version} ({commit})` line. Add a Vitest test for it in `AppFooter.test.tsx`.

The load-bearing consequence: four existing assertions check the footer's text **exactly**, and any new child of `<footer>` changes that text. They are updated in this item, otherwise `npm test` (criterion 2) and the CI e2e tier fail:
1. `frontend/src/components/AppFooter.test.tsx` → `expectFooterText(text)` does `expect(footer.textContent).toBe(text)` and is called by five tests.
2. `e2e/tests/TEST-10_footer_build_commit.spec.ts` line 34 `toHaveText("Task Notes v0.1.0 (a1b2c3d)")` and line 46 `toHaveText("Task Notes v0.1.0")`.
3. `e2e/tests/TEST-08_footer_app_version.spec.ts` line 58 `toHaveText("Task Notes")`.

Each keeps its exactness (the point of those assertions is "nothing else leaks into the footer", such as `undefined` or `unknown`): the expected string gains the trailing `Build note`, never a switch to `toContainText`. `TEST-04_page_footer.spec.ts` and `LandingPage.test.tsx` use substring assertions and need no change.

Assumptions (no tracker comments exist to settle them; recorded here and to be carried into the PR description):
- The text is exactly `Build note`, static, with no value after it. The description says only "a one-line footer text 'Build note'"; a configurable or environment-driven note would be gold plating.
- The note renders in every footer state (request pending, request failed, version only, version and commit). The description attaches no condition to it.
- "One-line" is read as "its own single line in the footer", hence a block element after the identity line rather than more inline text on that line.
- Updating the existing exact-text assertions is required by criterion 2, not scope creep.

## Frontend Plan
- Components to create/modify: modify `frontend/src/components/AppFooter.tsx` only. After the existing identity markup (app name, optional version span, optional commit span), append `<div data-testid="app-footer-build-note">Build note</div>` as the footer's last child, outside every conditional. Use a named constant (`BUILD_NOTE = "Build note"`) beside the existing `APP_NAME`, matching the file's own convention. No new style: the div inherits `footerStyle` (font size, color) from the `<footer>`.
- Routes: none (the footer is on the single `/` page).
- State management: none. The note is static and independent of the `buildInfo` state.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No API change: the build note is static frontend text and calls nothing. The existing `GET /api/version` contract the footer already consumes is untouched.

## Technology Selection
- Build note line: no net-new component, module or dependency; it is one static JSX element inside the existing `AppFooter.tsx`. A CSS `::after { content: "Build note" }` on the footer was considered and rejected, because pseudo-element text is not DOM text, so the Vitest test (criterion 1) could not assert it and assistive technology does not reliably announce it.

## File Manifest
### New files
- [G] e2e/uat/scenarios/FEAT-9_footer_build_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (note present when `/api/version` is unreachable)
- [G] e2e/uat/scripts/FEAT-9_footer_build_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/FEAT-9/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/AppFooter.tsx: add the `BUILD_NOTE` constant and the unconditional `<div data-testid="app-footer-build-note">` as the footer's last child
- [A] frontend/src/components/AppFooter.test.tsx: add the Vitest test(s) for the build note, and update `expectFooterText` so the exact expected footer text ends with `Build note`
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: the two exact `toHaveText` footer assertions gain the trailing `Build note`
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the exact `toHaveText("Task Notes")` footer assertion gains the trailing `Build note`

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: Vitest component tests in `frontend/src/components/AppFooter.test.tsx`.
  - `renders the build note on its own line in the footer`: `getByTestId("app-footer-build-note")` has text `Build note` and is contained in `getByTestId("app-footer")` (and in `getByRole("contentinfo")`).
  - Edge case `renders the build note when the version request fails`: with `fetchBackendBuildInfo` rejected, the footer text is exactly `Task NotesBuild note`.
  - Edge case: the pending-request test keeps proving the note is present before any build info arrives (via the updated `expectFooterText`).
  - The five existing tests keep their assertions; `expectFooterText(text)` now asserts `footer.textContent` is exactly `` `${text}Build note` `` and still rejects `undefined`, `null`, `unknown`, `Error`.
  - Directory: frontend tests sit beside the component (`frontend/src/components/*.test.tsx`), the precedent every existing frontend test follows; CLAUDE.md's `backend/tests/unit/` and `test_{module}_unit.py` apply to the backend only.
  - Naming: `{Component}.test.tsx`, per the existing frontend precedent.
- Integration tests: not warranted. Integration Tests is ENABLED, but this item adds no repository, model, migration or endpoint (`testing_standards.md` Section 6, questions 2 and 3).
  - Directory: backend/tests/integration/ (untouched)
- E2E tests: no new spec, since no criterion is assigned to E2E below. Two existing specs are updated because their exact footer-text assertions would otherwise fail: `TEST-10_footer_build_commit.spec.ts` (lines 34 and 46) and `TEST-08_footer_app_version.spec.ts` (line 58). They must still pass, because E2E CI scope is `plan` and this diff changes `*.tsx` under `frontend/`, so the CI e2e tier runs.
  - Directory: e2e/tests/
  - File: no new file (`{feature_id}_{slug}.spec.ts` would be `FEAT-9_footer_build_note.spec.ts`, not created)
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The page footer renders the one-line text `Build note` | Unit | Verifying it needs no navigation or interaction: the text is static and present on the component's first render, which a Vitest render of `AppFooter` observes directly (and the feature asks for a Vitest test) |
| 2 | `npm --prefix frontend test` passes | Unit | It is a statement about the Vitest suite itself, verified by running that suite (the frontend half of the configured test gate), with no UI involved |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | The page footer renders the one-line text `Build note` | covered at Unit, see Criterion coverage | Given the app is running, When I open the landing page, Then the footer shows `Build note` on its own line below the app name and version |
| 2 | `npm --prefix frontend test` passes | covered at Unit, see Criterion coverage | Given the repository is checked out with frontend dependencies installed, When I run `npm --prefix frontend test`, Then the run reports 0 failed |

## Manual verification plan
### Criterion 1: The page footer renders the one-line text `Build note`
Prerequisites: the app stack is running (`docker compose up` from the repository root) and the frontend answers at `http://localhost:5183` (CLAUDE.md E2E Base URL); use a desktop browser with DevTools.
1. Open `http://localhost:5183/` → the landing page shows the heading `Task Notes`, the note form and the note list.
2. Scroll to the bottom of the page → the footer shows a first line `Task Notes v{version}` (followed by `({7-character commit})` when the backend reports a commit) and, on its own line directly below it, the text `Build note`, in the same small grey footer text.
3. Right-click `Build note` and choose Inspect → the element is `<div data-testid="app-footer-build-note">Build note</div>` inside `<footer data-testid="app-footer">`.
4. Edge case: in DevTools → Network, block the request URL `/api/version`, then reload `http://localhost:5183/` → the footer's first line reads only `Task Notes`, and `Build note` is still shown on the line below; no `undefined`, `null` or `unknown` appears anywhere in the footer.
5. Unblock `/api/version` in DevTools so the browser is left as it was.

### Criterion 2: `npm --prefix frontend test` passes
Prerequisites: the repository is checked out on `feature/FEAT-9-footer-build-note` and frontend dependencies are installed (`npm --prefix frontend install`). This criterion is verified in a terminal, not in the UI.
1. From the repository root, run `npm --prefix frontend test` → Vitest runs every frontend test file, including `src/components/AppFooter.test.tsx` and `src/components/LandingPage.test.tsx`.
2. Read the summary at the end of the output → 0 failed, and the command exits with status 0.
3. Read the `AppFooter.test.tsx` block in the output → the build-note tests (`renders the build note on its own line in the footer`, `renders the build note when the version request fails`) are listed as passed.
