# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
- [ ] The footer renders the version string on the landing page.
- [ ] The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
- [ ] When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): 25 comments on the ClickUp task, all framework PR-opened notes from earlier runs plus one operator reset note (2026-09-07), as counted by the dispatching session and recorded in `decisions.md` → Not acted on because none states a requirement, a correction or an amendment to the description.
- Assumption (description note, not a comment): the task's Notes say the feature modifies `LandingPage.tsx`. On the current base (fd23f86) `LandingPage.tsx` already renders `<AppFooter />` and `AppFooter.tsx` already imports `version` from `frontend/package.json` (delivered by TEST-04). The remaining work is the absent-version path and its tests, which lives entirely in `AppFooter.tsx`, so this plan leaves `LandingPage.tsx` unchanged. Recorded rather than blocked on (`user_story_alignment.md` Section 2 step 3).
- Merged since the last plan: n/a (fresh plan, no previous plan for this item on this base).

## Plan Overview
Criteria 1 and 2 are already satisfied on the base branch by TEST-04: `frontend/src/components/AppFooter.tsx` renders `Task Notes v{version}` with `version` imported from `frontend/package.json` (the single declared source), and `LandingPage.tsx` renders the footer. What is missing is criterion 3 (a missing or blank version must not render `vundefined`, `vnull` or a dangling `v`) and criterion 4 (a component test for both paths).

The change is one component and its test file:
- `AppFooter` gains one optional prop, `version?: string | null`, whose default is the `version` imported from `frontend/package.json`. The prop exists so the absent path is testable without mocking a JSON module; production callers (LandingPage) pass nothing and get the package version.
- The footer renders `Task Notes v{version}` only when `version` is a string with non-whitespace content; otherwise it renders exactly `Task Notes`, with no `v`, no trailing space and no empty element.
- `AppFooter.test.tsx` gains the present-path assertion on the exact text and the absent-path assertions (null, empty string, whitespace-only).

No backend, no new dependency, no new route. Scope kept to the criteria (`user_story_alignment.md` Section 3): no build-time variable, no `/api/version` call (that endpoint exists from TEST-05 but the criterion names the frontend package metadata as a valid single source, and adding a network fetch would add failure modes nobody asked for).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx`: rename the import to `import { version as packageVersion } from "../../package.json";`; add `type AppFooterProps = { version?: string | null };`; signature `function AppFooter({ version = packageVersion }: AppFooterProps)`; compute `const hasVersion = typeof version === "string" && version.trim() !== "";` and render `{hasVersion ? `${APP_NAME} v${version.trim()}` : APP_NAME}` inside the existing `<footer data-testid="app-footer" style={footerStyle}>`. Keep `APP_NAME`, `footerStyle`, the `data-testid` and the `<footer>` element (contentinfo landmark) exactly as they are, since TEST-04's unit and E2E tests depend on them. A one-line comment explains why the prop exists (testability of the unresolved path), per `coding_standards.md` Section 1 (comments explain why).
  - `frontend/src/components/AppFooter.test.tsx`: add the tests listed under Testing Strategy; keep the three existing tests.
  - `frontend/src/components/LandingPage.tsx`: unchanged (see Re-Plan Feedback assumption).
- Routes: none (landing page at `/`, unchanged).
- State management: none; the version is a module-level import resolved at build time by Vite's JSON import.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep the footer's existing values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No API contract changes: the feature reads the version at build time from `frontend/package.json` and calls no endpoint. Component contract instead:
- `AppFooter` props: `version?: string | null` (optional; defaults to `frontend/package.json` → `version`).
- Rendered text: `Task Notes v{version}` when `version` has non-whitespace content (trimmed), otherwise `Task Notes`.

## Technology Selection
- Version source: chose Vite's native JSON module import of `frontend/package.json` (already in use since TEST-04) over a `define`-injected build-time variable or a fetch of the existing `GET /api/version`, because the import already is the single declared source the criterion names and needs no config or network path.
- Absent-path testability: chose an optional component prop with a default over `vi.mock` of the JSON module, because a hoisted module mock would force a second test file per path; no new dependency is involved.
- No net-new module or dependency is introduced by this feature.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (blank version)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/AppFooter.tsx: optional `version` prop defaulting to the package.json version; render `Task Notes` alone when the version is missing or blank
- [A] frontend/src/components/AppFooter.test.tsx: component tests for the version-present and version-absent paths

No dependency is added or changed, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests (Vitest component tests, `frontend/src/components/AppFooter.test.tsx`, colocated per the existing frontend convention):
  - `renders the app name followed by the version when a version is given`: `render(<AppFooter version="1.2.3" />)` → `app-footer` has text exactly `Task Notes v1.2.3`.
  - existing `renders the version imported from package.json` stays: default render contains the `version` imported from `frontend/package.json` in the test (criterion 2: the rendered value is the package value, not a literal in the component).
  - `renders only the app name when the version is null`: `render(<AppFooter version={null} />)` → text exactly `Task Notes`; text does not contain `undefined`, `null` or `v`-suffix (assert `toHaveTextContent(/^Task Notes$/)`).
  - `renders only the app name when the version is an empty string`: `version=""` → exactly `Task Notes`.
  - `renders only the app name when the version is whitespace`: `version="   "` → exactly `Task Notes` (edge case).
  - Existing `LandingPage.test.tsx` test `renders the footer with the app name and version` stays and covers criterion 1 on the landing page; no change to that file.
  - Directory: `frontend/src/components/` (frontend tests are colocated; `backend/tests/unit/` from CLAUDE.md is the backend's)
  - Naming: `{Component}.test.tsx`, matching the existing frontend files
- Integration tests: none warranted: no repository, model, migration or endpoint changes (`testing_standards.md` Section 6).
- E2E tests: none warranted for this item: no criterion requires navigation or interaction to verify (see Criterion coverage). The browser path of the footer showing the package version on `/` is already exercised by the existing `e2e/tests/TEST-04_page_footer.spec.ts`, which this change must keep green unchanged.
  - Directory: e2e/tests/
  - File: none created for TEST-08
- UAT scenarios: one Gherkin scenario per criterion plus a blank-version edge case, and the manual script from the plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page. | Unit | Verifying it needs no navigation or interaction: rendering `LandingPage` in jsdom and reading `app-footer` (existing `LandingPage.test.tsx`) shows it; the existing TEST-04 E2E spec already covers the browser render. |
| 2 | The version comes from a single declared source, never a string typed into the component. | Unit | It is a source-of-value rule: the default-render test compares against the `frontend/package.json` value, and the review reads that `AppFooter.tsx` holds no version literal. |
| 3 | When the version cannot be resolved, the footer renders without it. | Unit | It is a rendering rule over a prop value (null, empty, whitespace); no UI interaction can produce an unresolved version in a running build. |
| 4 | A component test asserts both paths: version present, and version absent. | Unit | The criterion itself names the component-test tier. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page. | covered at Unit, see Criterion coverage | Given the app is running When I open the landing page Then the footer reads "Task Notes v" followed by the frontend package version |
| 2 | The version comes from a single declared source. | covered at Unit, see Criterion coverage | Given frontend/package.json declares version X When I open the landing page Then the footer shows X |
| 3 | When the version cannot be resolved, the footer renders without it. | covered at Unit, see Criterion coverage | Given no version is resolvable When the footer renders Then it reads exactly "Task Notes" with no "undefined", "null" or trailing "v" |
| 4 | A component test asserts both paths. | covered at Unit, see Criterion coverage | Given the AppFooter test file When the frontend tests run Then the present and absent tests pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page.
Prerequisites: frontend dev server running (`npm --prefix frontend run dev`, or the compose stack) and reachable at http://localhost:5183; `frontend/package.json` declares `"version": "0.0.0"` on the base branch.
1. Open http://localhost:5183/ in a browser → the landing page shows the "Task Notes" heading, the note form and the note list.
2. Scroll to the bottom of the page → a small grey footer line reads `Task Notes v0.0.0`.

### Criterion 2: The version comes from a single declared source.
Prerequisites: as Criterion 1.
1. Open `frontend/src/components/AppFooter.tsx` → the version is imported from `../../package.json`; no version number such as `0.0.0` is typed anywhere in the file.
2. Edit `frontend/package.json` and set `"version": "0.0.1"`, save → the dev server reloads.
3. Reload http://localhost:5183/ → the footer reads `Task Notes v0.0.1`.
4. Revert `frontend/package.json` to `"version": "0.0.0"` → after reload the footer reads `Task Notes v0.0.0` again.

### Criterion 3: When the version cannot be resolved, the footer renders without it.
A running build always resolves the package version, so this path cannot be reached through the UI without breaking the package file; the observable check is the component test.
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run reports `0 failed`, including the three version-absent tests (null, empty string, whitespace), each asserting the footer text is exactly `Task Notes`.

### Criterion 4: A component test asserts both paths.
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test rendering `<AppFooter version="1.2.3" />` expecting `Task Notes v1.2.3`, and tests rendering `version={null}`, `version=""` and `version="   "` expecting exactly `Task Notes`.
2. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/components/LandingPage.test.tsx` → `0 failed`.
