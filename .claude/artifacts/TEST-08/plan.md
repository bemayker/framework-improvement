# Implementation Plan, TEST-08: Footer shows the app version

## Feature

> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

Source: ClickUp task `123k99ctgch` (https://app.clickup.com/t/123k99ctgch), status "to do", 0 comments, 0 replies. `hybrid` source, tracker-resident item.

## Acceptance Criteria

- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Plan Overview

**Most of this item is already on `main`.** TEST-04 (done, merged) added `frontend/src/components/AppFooter.tsx`, which renders `{APP_NAME} v{version}` with `version` imported by name from `frontend/package.json`, carries `data-testid="app-footer"`, and is exercised by `AppFooter.test.tsx`, by the footer case in `LandingPage.test.tsx`, and by `e2e/tests/TEST-04_page_footer.spec.ts`. Criteria 1 and 2 are therefore satisfied by code that exists today, and this plan adds no code for them. It covers them with the tests that already run and states that below.

**What `main` lacks is the delta this plan ships: criteria 3 and 4.** With a static JSON import the version is never absent at runtime, so nothing today decides what the footer does when the `version` field is missing or blank, and no test renders that path. Two changes, both under `frontend/src/`:

1. **A resolution seam, `frontend/src/appVersion.ts`.** It is the only place `package.json` is imported for display: `import { version } from "../package.json"`. It exports a pure `resolveVersion(raw: unknown): string | undefined` (a non-empty string after trimming resolves to that trimmed string; `undefined`, `null`, an empty or whitespace-only string, and any non-string resolve to `undefined`) and `getAppVersion(): string | undefined`, which returns `resolveVersion(version)`. The single declared source stays `frontend/package.json` → `version` (criterion 2); the module only adds the guard.
2. **`AppFooter.tsx` renders from the seam.** It replaces its direct `package.json` import with `getAppVersion()` and renders exactly one of two texts: `Task Notes v{version}` when a version resolves (unchanged from TEST-04, with the version wrapped in `<span data-testid="app-footer-version">`), or `Task Notes` alone when it does not: no `v`, no `undefined`, no `null`, no trailing space, and no `app-footer-version` element in the DOM (criterion 3).

**`AppFooter.test.tsx` becomes the two-path component test (criterion 4)** by mocking `../appVersion` with `vi.mock` and `vi.fn`, the pattern `LandingPage.test.tsx` already uses for `../api/notes`: the present path sets `getAppVersion` to return `1.2.3` and asserts `Task Notes v1.2.3`; the absent path sets it to return `undefined` and asserts the footer's text is exactly `Task Notes`. The real wiring from `package.json` to the DOM stays covered unmocked by `LandingPage.test.tsx` (unchanged) and by the new `appVersion.test.ts`, which asserts `getAppVersion()` equals the `version` field of `frontend/package.json`.

**Which file changes, and why the item's note is out of date.** The note says the item modifies `LandingPage.tsx`. That was true of the pre-TEST-04 tree; TEST-04 extracted the footer into `AppFooter.tsx`, and `LandingPage.tsx` now only renders `<AppFooter />`. The footer text and the version guard belong in `AppFooter.tsx`, so that is the component this plan modifies, and `LandingPage.tsx` is not touched. The `depends_on [TEST-04]` edge is what makes this safe.

**Contract preserved.** `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark), and the present-path text `Task Notes v{version}` do not change, so `e2e/tests/TEST-04_page_footer.spec.ts`, `LandingPage.test.tsx`'s footer case and TEST-04's UAT artifacts keep passing without edits. The nested `<span>` does not change the footer's text content that those tests assert on.

**Scope boundaries.** No backend file, no dependency, no `vite.config.ts` or `tsconfig*.json` change, no `LandingPage.tsx` change, no restructuring of the footer, no i18n layer, no new E2E spec (see `## Testing Strategy`).

### Assumptions

Recorded per `user_story_alignment.md` Section 2 (assume and document, never block). The builder carries these into the PR description.

- **A1. "Absent" means the `version` field of `frontend/package.json` is missing, empty, whitespace-only, or not a string.** With Vite's static JSON import that is the only way the value can fail to resolve at runtime; `resolveVersion` is the guard that turns each of those into `undefined`. The absent path is exercised by tests (and by a developer blanking the field, `## Manual verification plan` criterion 3), not by any production configuration.
- **A2. The absent rendering is the app name alone: `Task Notes`.** The criterion says "renders without it", and the app name is the only other content the footer has. No placeholder such as "version unknown" is added: it is not asked for.
- **A3. Whitespace is trimmed.** A `version` of `" 1.2.3 "` renders as `v1.2.3`. This is the one interpretation the criterion leaves open, chosen so a stray space in the manifest cannot produce a visibly odd `v 1.2.3`.
- **A4. Frontend tests stay colocated.** `CLAUDE.md`'s unit test directory and naming are pytest-shaped (`backend/tests/unit/`, `test_{module}_unit.py`); the frontend convention since TEST-01 is `{Module}.test.ts(x)` beside the module, run by `vitest run`. `appVersion.test.ts` follows `api/notes.test.ts`; `AppFooter.test.tsx` already exists.
- **A5. `AppFooter` gains no props.** A `version` prop or a `null` sentinel would be a test-only API; the mockable module seam gives the component test both paths without changing the component's public contract.

## Frontend Plan

- Components to create/modify:
  - **Create** `frontend/src/appVersion.ts`: `import { version } from "../package.json"` (named import, never a default import, so the rest of the manifest is tree-shaken out of the bundle as TEST-04 established); `export function resolveVersion(raw: unknown): string | undefined` (returns `raw.trim()` when `raw` is a string whose trimmed value is non-empty, else `undefined`); `export function getAppVersion(): string | undefined { return resolveVersion(version); }`. Pure, no React, no side effects.
  - **Modify** `frontend/src/components/AppFooter.tsx`: drop the `../../package.json` import, `import { getAppVersion } from "../appVersion"`; inside the component `const appVersion = getAppVersion();` and render `<footer data-testid="app-footer" style={footerStyle}>{APP_NAME}{appVersion !== undefined && (<> <span data-testid="app-footer-version">v{appVersion}</span></>)}</footer>`, with a single literal space between the name and the span so the text content reads `Task Notes v0.0.0` and, on the absent path, exactly `Task Notes`. `APP_NAME`, `footerStyle`, the `<footer>` element and `data-testid="app-footer"` are unchanged.
  - **Not modified:** `frontend/src/components/LandingPage.tsx` (renders `<AppFooter />` and needs nothing else), `frontend/src/components/LandingPage.test.tsx` (its footer case keeps passing and is the unmocked proof that the `package.json` value reaches the page).
- Routes: none. The footer lives on the existing landing page at `/`.
- State management: none. `getAppVersion()` is a synchronous pure call evaluated at render.
- Design reference notes: AI freestyle

## Backend Plan

No backend changes required.

## API Integration Plan

No external API integration.

## API Contract

None: this feature adds no internal endpoint and consumes no external one.

## Technology Selection

- **Version resolution seam (`frontend/src/appVersion.ts`)**: chose a pure TypeScript module of roughly ten lines, built on the standard library alone (`typeof`, `String.prototype.trim`) and on the `package.json` import TEST-04 already established, over (i) a Vite `define` build-time variable (`__APP_VERSION__` in `vite.config.ts`) and (ii) `import.meta.env.VITE_APP_VERSION`. (i) was rejected because it does not produce a genuinely absent path either: to keep `TEST-04_page_footer.spec.ts` green the define would have to derive from `package.json`, giving the same never-absent value at the cost of a `vite.config.ts` edit, a `tsconfig.node.json` edit (that project is `composite: true` without `resolveJsonModule`, and `@types/node` is not installed, so neither a JSON import nor `readFileSync` type-checks there today), an ambient `declare const` file, and a README/DEVELOPMENT note about a new build input. (ii) was rejected because it requires the version to be typed into a `.env` file or injected by a wrapper script, which is the second declared source criterion 2 forbids. Neither alternative stays inside `frontend/src/`.
- **Absent-path testability**: chose Vitest's `vi.mock` + `vi.fn` on the `../appVersion` module (Vitest is already installed and this exact pattern is the repo's precedent in `LandingPage.test.tsx`) over adding a `version` prop or `null` sentinel to `AppFooter`'s public API, which would exist only for tests.
- **Version element marker (`data-testid="app-footer-version"`)**: a native `<span>` attribute per `coding_standards.md` Section 3.6; no component, module or dependency is introduced for it.
- **No new dependency** is added at any rung, so there is no lockfile change.

## File Manifest

### New files
- [A] frontend/src/appVersion.ts: single import of `version` from `../package.json`; exports pure `resolveVersion(raw: unknown): string | undefined` and `getAppVersion(): string | undefined`.
- [A] frontend/src/appVersion.test.ts: Vitest unit tests for `resolveVersion` (happy path `"0.0.0"`; edge cases `" 1.2.3 "` trimmed, `""`, `"   "`; error cases `undefined`, `null`, `42`) and for `getAppVersion()` returning the `version` field of `frontend/package.json` unmocked.
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (blank `version` field renders the footer as `Task Notes` alone).
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual script build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/components/AppFooter.tsx: replace the direct `package.json` import with `getAppVersion()` from `../appVersion`; render `Task Notes v{version}` (version in `<span data-testid="app-footer-version">`) when resolved, `Task Notes` alone when not; `<footer>`, `footerStyle`, `APP_NAME` and `data-testid="app-footer"` unchanged.
- [A] frontend/src/components/AppFooter.test.tsx: mock `../appVersion` (`vi.mock`, `vi.fn`, `vi.mocked(getAppVersion).mockReturnValue(...)` per test, reset in `beforeEach`); keep the app-name and contentinfo/test-id cases; replace the `package.json`-derived assertion with the present path (`1.2.3` → text `Task Notes v1.2.3`, `app-footer-version` has text `v1.2.3`) and add the absent path (`undefined` → text exactly `Task Notes`, no `undefined`, no `null`, no trailing `v`, `queryByTestId("app-footer-version")` is `null`).

No lockfile entry: this feature adds, removes or upgrades no dependency, so `frontend/package-lock.json` does not change. No `README.md` or `docs/DEVELOPMENT.md` entry: the feature changes no project structure, run configuration, dependency or test infrastructure (the version still comes from `frontend/package.json` and there is no new build input), so build-feature Section 15's condition is not met. No `[D]` entry: no criterion's covering tier is E2E (see `### Criterion coverage`), so Phase D writes no spec for this item and `e2e/tests/TEST-04_page_footer.spec.ts` continues to run unchanged as the browser-level check of the footer.

## Testing Strategy

- Unit tests: (a) `frontend/src/appVersion.test.ts`: `resolveVersion` with a valid string, a padded string, empty and whitespace-only strings, `undefined`, `null` and a number; `getAppVersion()` equals the `version` field read from `frontend/package.json` in the test itself (the unmocked proof of criterion 2). (b) `frontend/src/components/AppFooter.test.tsx`: both rendering paths against a mocked `getAppVersion` (criteria 3 and 4), plus the existing app-name and contentinfo/test-id cases. (c) `frontend/src/components/LandingPage.test.tsx`, unchanged: renders the whole landing page and asserts the footer contains the `package.json` version (criterion 1, present path, unmocked).
  - Directory: colocated with the module under `frontend/src/` (frontend convention established by TEST-01 and TEST-04; `CLAUDE.md`'s `backend/tests/unit/` is the pytest directory and does not apply to Vitest files), see Assumption A4.
  - Naming: `{Module}.test.ts` / `{Component}.test.tsx`.
- Integration tests: not warranted. The feature adds no repository, model, migration or router code (`testing_standards.md` Section 6, questions two and three answer no); the toggle is ENABLED but there is nothing at that tier to test.
  - Directory: `backend/tests/integration/` (unused by this item).
- E2E tests: not warranted for this item. No criterion needs navigation or interaction to verify (`testing_standards.md` Section 6, fourth question, asked per criterion below): the present path is a static render of `/` that jsdom covers and that `e2e/tests/TEST-04_page_footer.spec.ts` (four specs, including a mobile-viewport edge case) already executes in the browser on every CI run, and the absent path cannot be produced in a running browser without editing `package.json`, so a browser edge-case spec for it would be artificial. That existing spec must keep passing and is the regression guard for the footer contract.
  - Directory: `e2e/tests/` (no new file for this item).
  - File: none (`{feature_id}_{slug}.spec.ts` naming not exercised).
- UAT scenarios: one Gherkin scenario per criterion (footer shows the version; the version equals `frontend/package.json` → `version`; a blank version renders `Task Notes` alone with no `undefined`, `null` or dangling `v`; the component test file covers both paths) plus one edge case (whitespace-padded version renders trimmed). No interaction assertions duplicated from an E2E spec (`testing_standards.md` Section 5).
  - Directory: `e2e/uat/scenarios/` (Gherkin), `e2e/uat/scripts/` (manual script).

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page. | Unit | Verifying it needs no navigation or interaction: `LandingPage.test.tsx` renders the whole page in jsdom and asserts the footer contains the `package.json` version (existing case, no new code). The browser-level render is additionally already executed by TEST-04's `e2e/tests/TEST-04_page_footer.spec.ts`, which stays in CI unchanged. |
| 2 | The version comes from a single declared source, never a string typed into the component. | Unit | Verifying it needs no navigation or interaction: `appVersion.test.ts` asserts `getAppVersion()` equals the `version` read from `frontend/package.json`, and `LandingPage.test.tsx` asserts that same value reaches the DOM; the source is a code-level fact the reviewer confirms by reading `appVersion.ts` as the only `package.json` import. |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap. | Unit | Verifying it needs no navigation or interaction: it is a rendering rule of one component, covered by `resolveVersion` cases in `appVersion.test.ts` and by the absent-path render in `AppFooter.test.tsx`; the absent state cannot be reached in a browser without editing `package.json`. |
| 4 | A component test asserts both paths: version present, and version absent. | Unit | The criterion is itself a component test: `AppFooter.test.tsx` carries one case per path, and its presence and green run are the verification. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page. | Covered at Unit, see Criterion coverage (browser render already executed by `TEST-04_page_footer.spec.ts`). | Given the app is running, When I open `http://localhost:5183`, Then the footer identified by `app-footer` reads "Task Notes v" followed by a version number. |
| 2 | The version comes from a single declared source. | Covered at Unit, see Criterion coverage. | Given `frontend/package.json` declares a `version`, When I read the footer, Then the version shown equals that field exactly, And `frontend/src/appVersion.ts` is the only file importing it. |
| 3 | Absent version renders the footer without it. | Covered at Unit, see Criterion coverage. | Given the `version` field of `frontend/package.json` is empty, When I reload the landing page, Then the footer reads exactly "Task Notes", And it contains no "undefined", "null" or trailing "v". |
| 4 | A component test asserts both paths. | Covered at Unit, see Criterion coverage. | Given `frontend/src/components/AppFooter.test.tsx`, When I run `npm test` in `frontend/`, Then a present-path case and an absent-path case both pass. |
| E | Edge: whitespace-padded version. | Covered at Unit (`resolveVersion(" 1.2.3 ")`). | Given `version` is `" 1.2.3 "`, When I read the footer, Then it reads "Task Notes v1.2.3" with no extra space after the "v". |

## Manual verification plan

### Criterion 1: The footer renders the version string on the landing page.
Prerequisites: repository checked out on `feature/TEST-08-footer-app-version`; `cd frontend && npm install` done once; no other process bound to port 5183. Have `frontend/package.json` open: at the time of writing its `version` is `0.0.0`, and the expected footer text below uses that value; a later bump changes the expected text, not the steps.
1. In a terminal, from `frontend/`, run `npm run dev` → Vite reports the dev server listening on `http://localhost:5183`.
2. Open `http://localhost:5183` in a browser → the landing page loads with the heading "Task Notes" and the note form; a failed notes load (backend not running) is fine, the form stays visible.
3. Scroll to the bottom of the page → a footer below the note list reads exactly `Task Notes v0.0.0` (the `v` immediately followed by the `version` value from `frontend/package.json`, one space between "Notes" and "v").
4. Open the browser dev tools, Elements panel, and select the footer → it is a `<footer data-testid="app-footer">` element containing a `<span data-testid="app-footer-version">` whose text is `v0.0.0`.

### Criterion 2: The version comes from a single declared source, never a string typed into the component.
Prerequisites: the dev server from criterion 1 is still running; `frontend/package.json` is open in an editor.
1. In `frontend/package.json`, change `"version": "0.0.0"` to `"version": "9.8.7"` and save → Vite hot-reloads (the terminal logs an update).
2. Reload `http://localhost:5183` → the footer now reads exactly `Task Notes v9.8.7`, with no code change in any `.tsx` or `.ts` file.
3. In the editor, search `frontend/src/` for the text `package.json` → the only match is the import line in `frontend/src/appVersion.ts`; `AppFooter.tsx` contains no version literal.
4. Restore `"version": "0.0.0"` in `frontend/package.json` and save → the footer reads `Task Notes v0.0.0` again after reload.

### Criterion 3: When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap.
This state cannot be produced in the running UI without editing `frontend/package.json` (the version is a static build input), so the check is a developer-only edit plus the unit test that pins it.
Prerequisites: the dev server from criterion 1 is running; `frontend/package.json` is open in an editor.
1. In `frontend/package.json`, change `"version": "0.0.0"` to `"version": ""` and save → Vite hot-reloads.
2. Reload `http://localhost:5183` and read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no trailing space or blank area after the name.
3. In dev tools, Elements panel, select the footer → `<footer data-testid="app-footer">` contains the text "Task Notes" and no `app-footer-version` element.
4. Change the field to `"version": "   "` (three spaces) and save, then reload → the footer again reads exactly `Task Notes`.
5. Restore `"version": "0.0.0"` and save, then reload → the footer reads `Task Notes v0.0.0`.
6. In a second terminal, from `frontend/`, run `npm test` → the Vitest run passes, and the output lists `appVersion.test.ts` cases for `""`, whitespace, `undefined`, `null` and a non-string all resolving to `undefined`.

### Criterion 4: A component test asserts both paths: version present, and version absent.
Prerequisites: `cd frontend && npm install` done; no dev server needed.
1. Open `frontend/src/components/AppFooter.test.tsx` in the editor → it mocks `../appVersion` and contains one test whose `getAppVersion` mock returns `"1.2.3"` (asserting text `Task Notes v1.2.3`) and one whose mock returns `undefined` (asserting text exactly `Task Notes` and no `app-footer-version` element).
2. From `frontend/`, run `npx vitest run src/components/AppFooter.test.tsx` → both named tests pass, alongside the app-name and contentinfo cases; 0 failures.
3. From `frontend/`, run `npm test` → the whole Vitest suite passes, including the unchanged `LandingPage.test.tsx` footer case (proving the real `package.json` wiring still reaches the page).
4. From the repository root with the full stack running (`docker compose up --build`, frontend on `http://localhost:5183`), run `npx playwright test e2e/tests/TEST-04_page_footer.spec.ts` → all four TEST-04 specs pass, confirming the footer's `data-testid`, landmark role and `Task Notes v{version}` text contract are unchanged by this item.
