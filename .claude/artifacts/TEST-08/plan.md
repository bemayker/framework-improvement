# Implementation Plan, TEST-08: Footer shows the app version

## Feature

> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

Source: ClickUp task `123k99ctgch` (https://app.clickup.com/t/123k99ctgch), `hybrid` source, tracker-resident item. One actionable tracker comment (quoted in `## Re-Plan Feedback`), no PR review comments on plan PR #25, merged-since check `verdict=clean`. This is a re-plan: it replaces the previous plan, which read the version from `frontend/package.json`.

## Acceptance Criteria

- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. **Overridden by the tracker comment below: the single declared source is the backend's `GET /api/version` response, read at runtime.**
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback

- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. This matters because the two can diverge in exactly the situation where knowing the version is useful: a partial deploy. A footer that reports the frontend bundle's version tells you nothing about which API you are actually talking to, which is the question anyone reads a version string to answer. Two consequences I want handled explicitly rather than assumed: The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed, demand by demand:
  - **Runtime source.** The footer fetches the version from the backend on mount through a new client module `frontend/src/api/version.ts` and renders whatever `GET /api/version` returns. The `package.json` import in `AppFooter.tsx` is removed; nothing under `frontend/src/` reads the frontend's own version any more. Criterion 2's "frontend package metadata or a build-time variable" wording is overridden by this comment: the single declared source is now `backend/pyproject.toml` → `[project].version`, reaching the browser through `GET /api/version`.
  - **"Add a GET /api/version endpoint."** It already exists: TEST-05 (done, on `main`) shipped `backend/app/routers/version.py`, `backend/app/schemas/version.py` (`VersionResponse { version: str }`) and `backend/app/services/version_service.py` (`importlib.metadata.version("task-notes-backend")`, `unknown` sentinel when the distribution is not installed), registered in `backend/app/main.py`, and CORS already allows `GET` from `http://localhost:5183`. This plan adds no backend code and changes no backend file; `## Backend Plan` says so and the manifest carries no `[B]` entry. The comment's request is satisfied by consuming the endpoint, not by re-adding it.
  - **Loading state, recorded:** the footer reads exactly `Task Notes` while the fetch is pending. No placeholder, no spinner, no version. Reason: the request completes in milliseconds on a working stack, a flashing placeholder is noise, and the footer must never show a version that is not the backend's.
  - **Failure state, recorded:** the footer reads exactly `Task Notes · version unavailable` when the fetch rejects (network failure, non-2xx response, or a body without a non-empty string `version`). Reason: the comment's stated purpose is diagnosing which API the page is talking to, and a footer that looks the same when the backend is unreachable as when it is still loading hides the one failure that purpose is about. The message is a named constant in the component (`coding_standards.md` Section 3.3, strings kept ready for i18n). The "blank footer" alternative was rejected for exactly that indistinguishability; the literal `unknown` was rejected because the backend already uses `unknown` as its own sentinel for "installed without metadata", and reusing it in the frontend would make two different failures read identically.
  - **How criterion 3 relates:** "renders without it rather than `undefined`, `null` or an empty gap" now describes both non-resolved states. Neither prints `undefined` or `null`, neither leaves a dangling `v` or blank area, and the failure state adds a human-readable marker rather than a gap. The version element (`data-testid="app-footer-version"`) is absent from the DOM in both states.
  - **Backend change, stated explicitly:** this item still modifies no backend file, so its "frontend only" framing and the `feature_map.md` reasoning that TEST-08 is disjoint from TEST-06 and TEST-07 both hold. What changes is that the footer now has a **runtime dependency** on the backend (`GET /api/version`, TEST-05, done). `feature_map.md` lists `depends_on [TEST-04]` only; TEST-05 is done, so no scheduling consequence follows, and this plan does not edit the map (the planner never writes outside its artifacts). The dispatching session may want to record the TEST-05 edge for accuracy.
  - **Side effect the comment did not name, handled rather than silent:** TEST-04's E2E spec (`e2e/tests/TEST-04_page_footer.spec.ts`, four tests, three of which read `frontend/package.json` and assert the footer contains that value) and TEST-04's UAT artifacts describe the contract this comment overrides. `frontend/package.json` is `0.0.0` and the backend reports `0.1.0`, so those assertions fail on the first run after this change. This plan re-scopes them to the backend's response (see `## File Manifest`, `[D]` and `[G]` modified entries) instead of leaving a red spec for CI to discover.
- Comment (PR): none on plan PR #25.
- Merged since the last plan: `verdict=clean`, nothing on `origin/main` touches the previous plan's files; no entry dropped or re-scoped on that ground.

## Plan Overview

**The footer becomes a runtime consumer of `GET /api/version`.** Three frontend pieces, all under `frontend/src/`:

1. **A shared HTTP base, `frontend/src/api/http.ts`.** Exports `API_BASE_URL` (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`) and `requestFailed(operation, response)` (moved verbatim). `notes.ts` imports both instead of defining them; its behaviour and its tests are unchanged. Reason: a second client module that re-declares the default port would be a second source for a deployment-dependent value (`coding_standards.md` Section 5, "one value, one source").
2. **A version client, `frontend/src/api/version.ts`.** `export type VersionResponse = { version: string }` and `export async function getVersion(): Promise<string>`: `fetch(`${API_BASE_URL}/api/version`)`, throw `requestFailed("Loading the version", response)` on a non-OK response, parse the JSON, and throw `new Error("Loading the version failed: unexpected response shape")` unless `body.version` is a non-empty string after trimming; return the trimmed string. Components never call `fetch` directly (the `notes.ts` rule, `coding_standards.md` Section 4).
3. **`AppFooter.tsx` fetches on mount and renders one of three states.** Local state `type VersionState = { status: "loading" } | { status: "resolved"; version: string } | { status: "unavailable" }`, initial `{ status: "loading" }`, driven by a `useEffect` with the same `isMounted` guard `LandingPage.tsx` uses for `listNotes()`. Rendering, text content exactly:
   - loading: `Task Notes`
   - resolved: `Task Notes v{version}`, the version inside `<span data-testid="app-footer-version">v{version}</span>`
   - unavailable: `Task Notes · version unavailable`, the message inside `<span data-testid="app-footer-version-unavailable">`
   `<footer>`, `data-testid="app-footer"`, `APP_NAME` and `footerStyle` are unchanged.

**Tests.** `AppFooter.test.tsx` mocks `../api/version` (the `vi.mock` pattern `LandingPage.test.tsx` and `NoteForm.test.tsx` use for `../api/notes`) and asserts all three states (criteria 3 and 4). `LandingPage.test.tsx` gains the same mock so its footer case asserts the mocked backend version rather than `package.json`. `version.test.ts` stubs `fetch` and exercises the real client body, following `notes.test.ts`. A new E2E spec `TEST-08_footer_app_version.spec.ts` asserts the browser shows the version the backend actually returned (criterion 1) and uses `page.route` to force the failure and loading states deterministically (the per-feature edge-case specs). TEST-04's spec and UAT artifacts are re-scoped to the backend's response.

**Does this item still touch no backend file? Yes.** Every path in the manifest is under `frontend/src/`, `e2e/` or `.claude/artifacts/TEST-08/`. The backend endpoint, its schema, its service, its router registration and its tests exist on `main` from TEST-05 and are consumed as-is. The origin question (`coding_standards.md` Section 5) is already answered: `backend/app/core/config.py` allows `http://localhost:5183` and `GET`, and the request carries no custom header, so it is a simple cross-origin request with no preflight.

**Why the loading and failure texts differ, in one line:** a reader who sees `Task Notes · version unavailable` knows the API is unreachable; a reader who sees `Task Notes` knows the page has not heard back yet; conflating the two would defeat the comment's purpose.

**Scope boundaries.** No backend file, no new dependency, no `vite.config.ts`, `tsconfig*.json` or `docker-compose.yml` change, no `LandingPage.tsx` change (it renders `<AppFooter />` and needs nothing else), no retry or polling of `/api/version`, no caching, no version comparison between frontend and backend, no i18n framework (constants only, as the codebase already does), no `feature_map.md` edit.

### Assumptions

Recorded per `user_story_alignment.md` Section 2 (assume and document, never block). The builder carries these into the PR description.

- **A1. The backend's `unknown` sentinel is rendered verbatim.** `version_service.py` returns `"unknown"` when the distribution metadata is not installed (a non-`uv run` process; `docker-compose.yml` and the Dockerfile always use `uv run`, so the deployed stack never produces it). The frontend does not special-case that string: it would be a second declared copy of a backend value. A backend answering `unknown` therefore shows `Task Notes vunknown`, which is the backend's honest answer, and is noted here so nobody reads it as a frontend bug.
- **A2. Whitespace is trimmed; an empty or whitespace-only `version` counts as unresolvable.** `getVersion()` rejects such a body with the "unexpected response shape" error, so the footer shows the failure state rather than `Task Notes v`. The schema (`VersionResponse.version: str`) does not forbid an empty string, so the guard lives in the client.
- **A3. One fetch per mount, no retry.** The item asks for a version display, not resilience; a reload re-fetches. Retry logic (`coding_standards.md` Section 4, "when appropriate") is not appropriate for a footer label.
- **A4. Frontend tests stay colocated** as `{Module}.test.ts(x)` beside the module under `frontend/src/`, run by `vitest run` (the TEST-01 to TEST-04 convention; `CLAUDE.md`'s `backend/tests/unit/` and `test_{module}_unit.py` are the pytest shape and do not apply to Vitest files).
- **A5. `AppFooter` gains no props.** Mocking the `../api/version` module gives the component test all three states without a test-only public API.
- **A6. The `depends_on [TEST-05]` edge is not added by this plan.** TEST-05 is done, so the runtime dependency has no scheduling effect; the planner does not write `feature_map.md`.

## Frontend Plan

- Components to create/modify:
  - **Create** `frontend/src/api/http.ts`: `export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;` with `const DEFAULT_API_BASE_URL = "http://localhost:8010";`, and `export function requestFailed(operation: string, response: Response): Error` (body identical to the current private helper in `notes.ts`). No other exports.
  - **Create** `frontend/src/api/version.ts`: `export type VersionResponse = { version: string };` `const VERSION_URL = `${API_BASE_URL}/api/version`;` `export async function getVersion(): Promise<string>` as described in `## Plan Overview` item 2. Header comment mirrors `notes.ts`'s first two lines (components never call `fetch` directly).
  - **Modify** `frontend/src/api/notes.ts`: delete the local `DEFAULT_API_BASE_URL`, `API_BASE_URL` and `requestFailed` definitions and `import { API_BASE_URL, requestFailed } from "./http";`. `NOTES_URL`, `listNotes`, `createNote`, the `Note` type and every error message are unchanged. `notes.test.ts` is not modified: its `vi.stubEnv` + `vi.resetModules` + dynamic `import("./notes")` case still exercises the resolution because `resetModules` re-evaluates `./http` too.
  - **Modify** `frontend/src/components/AppFooter.tsx`: remove `import { version } from "../../package.json"`; `import { useEffect, useState, type CSSProperties } from "react"; import { getVersion } from "../api/version";`; add `const VERSION_UNAVAILABLE_MESSAGE = "version unavailable";` and `const VersionState` union from `## Plan Overview` item 3; `useEffect(() => { let isMounted = true; getVersion().then((v) => { if (isMounted) setState({ status: "resolved", version: v }); }).catch(() => { if (isMounted) setState({ status: "unavailable" }); }); return () => { isMounted = false; }; }, []);`. Render:
    ```tsx
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {state.status === "resolved" && (
        <> <span data-testid="app-footer-version">v{state.version}</span></>
      )}
      {state.status === "unavailable" && (
        <> · <span data-testid="app-footer-version-unavailable">{VERSION_UNAVAILABLE_MESSAGE}</span></>
      )}
    </footer>
    ```
    Text content per state: `Task Notes`, `Task Notes v0.1.0`, `Task Notes · version unavailable` (one space either side of the middle dot). The catch swallows the error deliberately (the failure is rendered, not logged; the codebase has no frontend logger and `console.log` is forbidden by `coding_standards.md` Section 2.3).
  - **Modify** `frontend/src/components/AppFooter.test.tsx`: `vi.mock("../api/version", () => ({ getVersion: vi.fn() }))`, `const getVersionMock = vi.mocked(getVersion)`, `beforeEach(() => getVersionMock.mockReset())`. Cases: (1) app name renders (mock resolves `"1.2.3"`); (2) present path: mock resolves `"1.2.3"`, `await screen.findByTestId("app-footer-version")` has text `v1.2.3` and the footer has text content `Task Notes v1.2.3`; (3) absent path: mock rejects `new Error("Loading the version failed: 500 Internal Server Error")`, `await screen.findByTestId("app-footer-version-unavailable")`, footer text is exactly `Task Notes · version unavailable`, contains neither `undefined` nor `null`, and `queryByTestId("app-footer-version")` is `null`; (4) loading path: mock returns `new Promise<string>(() => {})`, footer text is exactly `Task Notes` and both version test ids are absent; (5) the existing contentinfo/test-id case, kept. Delete the `package.json` import.
  - **Modify** `frontend/src/components/LandingPage.test.tsx`: add `vi.mock("../api/version", () => ({ getVersion: vi.fn() }))`, `getVersionMock.mockReset(); getVersionMock.mockResolvedValue("1.2.3");` in `beforeEach`; the footer case becomes `expect(await screen.findByTestId("app-footer-version")).toHaveTextContent("v1.2.3")` alongside the existing `Task Notes` assertion. Delete the `package.json` import. All other cases unchanged.
  - **Not modified:** `frontend/src/components/LandingPage.tsx`, `frontend/src/api/notes.test.ts`, `frontend/package.json`, `frontend/vite.config.ts`.
- Routes: none. The footer lives on the existing landing page at `/`.
- State management: component-local `useState` + `useEffect` (native React, the `LandingPage.tsx` precedent). No context, no store, no custom hook (one consumer).
- Design reference notes: AI freestyle

## Backend Plan

No backend changes required. `GET /api/version` exists from TEST-05 (`backend/app/routers/version.py` → `VersionResponse(version=get_app_version())`, registered in `backend/app/main.py`, CORS for `http://localhost:5183` and `GET` already configured in `backend/app/core/config.py`) and is consumed as-is.

## API Integration Plan

No external API integration. The version endpoint is this project's own backend, consumed through the frontend client layer described in `## Frontend Plan`.

## API Contract

Internal, existing, unchanged (TEST-05):

- Method: `GET`
- URL: `{VITE_API_BASE_URL}/api/version` (default `http://localhost:8010/api/version`)
- Request: no body, no query, no custom headers
- Response: `200` with `{"version": "0.1.0"}` (`VersionResponse`, `version: str`, the value of `backend/pyproject.toml` → `[project].version` via installed metadata; `"unknown"` when metadata is not installed). Frontend consumption: `getVersion(): Promise<string>` resolves to the trimmed `version`; rejects on a non-OK status, a network error, or a body whose `version` is not a non-empty string.

## Technology Selection

- **Version client (`frontend/src/api/version.ts`)**: chose the platform `fetch` API in a plain module shaped like `notes.ts` over adding an HTTP library (axios, ky) and over calling `fetch` inside the component; the codebase's client-layer rule already exists and `fetch` covers a single GET. No new dependency.
- **Shared HTTP base (`frontend/src/api/http.ts`)**: chose extracting the existing `API_BASE_URL` resolution and `requestFailed` helper out of `notes.ts` into one module over (i) duplicating the three lines in `version.ts`, which would make the default backend port a two-source value (`coding_standards.md` Section 5), and over (ii) a generic client class or request wrapper, which two GETs and one POST do not justify.
- **Async state in `AppFooter`**: chose React's `useState` + `useEffect` (an installed dependency, and the exact pattern `LandingPage.tsx` uses for `listNotes()`) over a data-fetching library (react-query, SWR: new dependency for one request) and over a custom `useAppVersion` hook (`coding_standards.md` Section 3.3 reserves custom hooks for reusable logic; the footer is the only consumer).
- **Loading and failure markers**: native `<span>` elements with `data-testid` attributes (`coding_standards.md` Section 3.6); no component, module or dependency is introduced for them.
- **Deterministic failure and loading states in E2E**: chose Playwright's built-in `page.route` (already installed) over stopping the backend container inside a spec or adding a mock server. The route matcher must be a URL predicate on `pathname === "/api/version"`, never the glob `**/api/version`: Vite serves the frontend module `src/api/version.ts` from a URL containing the same substring (the `TEST-03_simple_note_form.spec.ts` comment records this trap for `/api/notes`).
- **Backend**: nothing net-new; the endpoint, schema and service exist.
- **No new dependency** at any rung, so there is no lockfile change.

## File Manifest

### New files
- [A] frontend/src/api/http.ts: exports `API_BASE_URL` (`VITE_API_BASE_URL` with the `http://localhost:8010` default) and `requestFailed(operation, response)`, both moved from `notes.ts`.
- [A] frontend/src/api/version.ts: `VersionResponse` type and `getVersion(): Promise<string>` calling `GET {API_BASE_URL}/api/version`; rejects on non-OK, network error or a body without a non-empty string `version`.
- [A] frontend/src/api/version.test.ts: Vitest unit tests with `fetch` stubbed (the `notes.test.ts` pattern): happy path returns `"0.1.0"` and called `http://localhost:8010/api/version`; edge case trims `" 1.2.3 "`; error cases: non-OK `500 Internal Server Error` rejects with `Loading the version failed: 500 Internal Server Error`, body `{}` and body `{ version: "" }` reject with the unexpected-shape error; `VITE_API_BASE_URL` override via `vi.stubEnv` + `vi.resetModules` reaches `https://notes.example.test/api/version`.
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: four specs. (1) `page.goto("/")`, `page.waitForResponse` on `pathname === "/api/version"` and `ok()`, read its JSON, expect `app-footer-version` to have text `v{body.version}` and `app-footer` to contain `Task Notes v{body.version}`. (2) Edge, unreachable: `page.route` predicate on `/api/version` → `route.abort()`, expect `app-footer` to have text `Task Notes · version unavailable`, `app-footer-version` count 0, footer text contains neither `undefined` nor `null`. (3) Edge, server error: same route → `route.fulfill({ status: 500 })`, same assertions as (2). (4) Edge, loading: route handler awaits a deferred promise before fulfilling; while held, expect `app-footer` to have text exactly `Task Notes` and both version test ids to have count 0; then fulfill `{ "version": "7.7.7" }` and expect `app-footer-version` to have text `v7.7.7`.
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: one scenario per criterion (version shown; version equals the `GET /api/version` response, not `frontend/package.json`; backend unreachable renders `Task Notes · version unavailable` with no `undefined`/`null`/dangling `v`; component test covers present and absent) plus edge scenarios for the loading state and for a frontend whose `package.json` version differs from the backend's.
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual script build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/api/notes.ts: replace the local `DEFAULT_API_BASE_URL`, `API_BASE_URL` and `requestFailed` definitions with `import { API_BASE_URL, requestFailed } from "./http"`; every exported function, URL and error message unchanged.
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch `getVersion()` on mount with an `isMounted` guard; render `Task Notes` while loading, `Task Notes v{version}` with `<span data-testid="app-footer-version">` when resolved, `Task Notes · version unavailable` with `<span data-testid="app-footer-version-unavailable">` on failure; `<footer>`, `data-testid="app-footer"`, `APP_NAME`, `footerStyle` unchanged.
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert the resolved, unavailable and loading states as listed in `## Frontend Plan`; keep the contentinfo/test-id case; remove the `package.json` import.
- [A] frontend/src/components/LandingPage.test.tsx: add the `../api/version` mock resolving `"1.2.3"`; footer case asserts `app-footer-version` reads `v1.2.3`; remove the `package.json` import; other cases unchanged.
- [D] e2e/tests/TEST-04_page_footer.spec.ts: the footer now shows the backend's version, and `frontend/package.json` (`0.0.0`) differs from the backend (`0.1.0`), so the three tests reading `package.json` would fail. Replace the `readFileSync` of `frontend/package.json` with a helper that `page.goto("/")` and `waitForResponse` on `pathname === "/api/version"` returns the body's `version`; assert the footer, the contentinfo landmark and the mobile-viewport footer contain that value. The heading/subtitle test is unchanged. Test ids, roles and the four test names' intent are preserved.
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: in the first scenario replace `And that version number matches the "version" field of frontend/package.json` with the version reported by `GET /api/version`. Nothing else in the file changes (its stale port numbers are outside this item).
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite bullet and step 4 that compare the footer with `frontend/package.json` now compare it with the `version` field of `curl http://localhost:8010/api/version`. Nothing else changes.

No lockfile entry: this feature adds, removes or upgrades no dependency, so `frontend/package-lock.json` and `backend/uv.lock` do not change. No `README.md` or `docs/DEVELOPMENT.md` entry: the frontend already calls the backend through `VITE_API_BASE_URL` (wired in `docker-compose.yml` and defaulted in code), so a second call to the same base adds no project structure, run configuration, dependency or test infrastructure, and build-feature Section 15's condition is not met.

## Testing Strategy

- Unit tests: (a) `frontend/src/api/version.test.ts`: the real `getVersion()` body against a stubbed `fetch` (happy path, trimmed value, non-OK rejection, malformed body rejection, empty `version` rejection, `VITE_API_BASE_URL` override). (b) `frontend/src/components/AppFooter.test.tsx`: the three rendering states against a mocked `getVersion` (criteria 3 and 4), plus the contentinfo/test-id case. (c) `frontend/src/components/LandingPage.test.tsx`: whole-page render with both API modules mocked, footer shows the mocked backend version (criterion 2 at the component boundary: the rendered value is the client's return value and nothing else).
  - Directory: colocated with the module under `frontend/src/` (Assumption A4; `CLAUDE.md`'s `backend/tests/unit/` is the pytest directory and does not apply to Vitest files).
  - Naming: `{Module}.test.ts` / `{Component}.test.tsx`.
- Integration tests: not warranted for this item. It adds or modifies no repository, model, migration or router code (`testing_standards.md` Section 6, questions two and three answer no); the existing `backend/tests/integration/test_version_integration.py` already covers the endpoint's 200 and 405 paths and keeps running unchanged.
  - Directory: `backend/tests/integration/` (no new file for this item).
- E2E tests: warranted for criterion 1 (the version is now a runtime fetch whose result is only observable in a running browser talking to a running backend) and for the per-feature edge cases. `e2e/tests/TEST-08_footer_app_version.spec.ts`: the happy path asserts the footer shows the version the browser's own `GET /api/version` response carried (no backend URL is needed in the spec: `waitForResponse` on the request the page issues supplies both the value and the proof that the source is the backend); the three edge specs force the failure state (abort, HTTP 500) and the loading state (held route) with `page.route` predicates on `pathname === "/api/version"`. Locators: `data-testid` first (`testing_standards.md` Section 1.3). The re-scoped `TEST-04_page_footer.spec.ts` stays in CI as the regression guard for the footer's landmark and test-id contract.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one Gherkin scenario per criterion plus the loading-state and version-mismatch edge scenarios; no interaction assertions duplicated from the E2E spec (`testing_standards.md` Section 5).
  - Directory: `e2e/uat/scenarios/` (Gherkin), `e2e/uat/scripts/` (manual script).

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page. | E2E | — (the version is fetched at runtime from the backend, and only a browser against the running stack observes that the rendered string is the backend's answer; `TEST-08_footer_app_version.spec.ts` spec 1) |
| 2 | The version comes from a single declared source (the backend's `GET /api/version`, per the tracker comment), never a string typed into the component. | Unit | Verifying it needs no navigation or interaction: `version.test.ts` proves `getVersion()` returns the body of `GET {API_BASE_URL}/api/version`, `AppFooter.test.tsx` and `LandingPage.test.tsx` prove the rendered version is exactly the client's return value, and the reviewer confirms by reading that no `package.json` import and no version literal remain under `frontend/src/`. |
| 3 | When the version cannot be resolved, the footer renders without it rather than `undefined`, `null` or an empty gap. | Unit | Verifying it needs no navigation or interaction: it is a rendering rule of one component, asserted in `AppFooter.test.tsx` for the rejected and the pending client call (text exactly `Task Notes · version unavailable` and `Task Notes`, no version element). The E2E edge specs additionally exercise it in the browser, as the per-feature edge-case obligation, but the covering tier is the component test. |
| 4 | A component test asserts both paths: version present, and version absent. | Unit | The criterion is itself a component test: `AppFooter.test.tsx` carries a resolved-path case and an unavailable-path case (plus the loading case), and their green run is the verification. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page. | Open `/`, wait for the page's own `GET /api/version` response, assert `app-footer-version` reads `v{response.version}` and `app-footer` contains `Task Notes v{response.version}`. | Given the stack is running, When I open `http://localhost:5183`, Then the footer identified by `app-footer` reads "Task Notes v" followed by the version `GET /api/version` returns. |
| 2 | The version comes from the backend's `GET /api/version`, never a string typed into the component. | Covered at Unit, see Criterion coverage. | Given `backend/pyproject.toml` declares version `X` and `frontend/package.json` declares a different version, When I read the footer, Then it shows `X`. |
| 3 | Absent version renders the footer without it. | Edge specs 2 to 4: `page.route` aborts, returns 500, or holds `/api/version`; footer reads `Task Notes · version unavailable` (abort, 500) or exactly `Task Notes` (held), with no `undefined`, `null` or dangling `v`. | Given the backend is stopped, When I reload the landing page, Then the footer reads exactly "Task Notes · version unavailable" and contains no "undefined" or "null". |
| 4 | A component test asserts both paths. | Covered at Unit, see Criterion coverage. | Given `frontend/src/components/AppFooter.test.tsx`, When I run `npm test` in `frontend/`, Then a resolved-version case and an unavailable-version case both pass. |
| E1 | Edge: loading state. | Spec 4 (held route). | Given `/api/version` has not answered yet, When the page renders, Then the footer reads exactly "Task Notes". |
| E2 | Edge: frontend and backend versions differ. | Implicit in spec 1 (asserts the backend's value, never `package.json`'s). | Given `frontend/package.json` is `0.0.0` and the backend reports `0.1.0`, When I read the footer, Then it reads "Task Notes v0.1.0". |

## Manual verification plan

### Criterion 1: The footer renders the version string on the landing page.
Prerequisites: Docker and Docker Compose running; repository checked out on `feature/TEST-08-footer-app-version`; `cp .env.example .env` done once; no other process bound to ports 5183, 8010 or 5442. At the time of writing `backend/pyproject.toml` declares `version = "0.1.0"` and `frontend/package.json` declares `"version": "0.0.0"`; the expected texts below use those values, and a later bump changes the expected text, not the steps.
1. From the repository root run `docker compose up --build` → the `db`, `backend` and `frontend` services start; the backend log shows uvicorn listening on port 8010 and the frontend log shows Vite on `http://localhost:5183`.
2. In a terminal run `curl -s http://localhost:8010/api/version` → the response is exactly `{"version":"0.1.0"}`.
3. Open `http://localhost:5183` in a browser → the landing page loads with the heading "Task Notes", the note form and the saved-notes list.
4. Scroll to the bottom of the page → the footer reads exactly `Task Notes v0.1.0`: the `v` immediately followed by the value from step 2, one space between "Notes" and "v".
5. Open the browser dev tools, Elements panel, and select the footer → it is a `<footer data-testid="app-footer">` containing a `<span data-testid="app-footer-version">` whose text is `v0.1.0`; no element with `data-testid="app-footer-version-unavailable"` is present.
6. In dev tools, Network panel, reload the page and filter on `version` → exactly one request to `http://localhost:8010/api/version`, status 200, response body `{"version":"0.1.0"}`.

### Criterion 2: The version comes from a single declared source (the backend's `GET /api/version`), never a string typed into the component.
Prerequisites: the stack from criterion 1 is running; `backend/pyproject.toml` and `frontend/package.json` are open in an editor.
1. Read `frontend/package.json` → its `version` is `0.0.0`, and the footer from criterion 1 reads `v0.1.0`, so the footer is already not showing the frontend's own version.
2. In `backend/pyproject.toml`, change `version = "0.1.0"` to `version = "9.8.7"` and save; from the repository root run `docker compose up -d --build backend` → the backend image rebuilds (the Dockerfile's `uv sync` re-registers the package metadata) and the container restarts.
3. Run `curl -s http://localhost:8010/api/version` → the response is `{"version":"9.8.7"}`.
4. Reload `http://localhost:5183` → the footer reads exactly `Task Notes v9.8.7`, with no change to any file under `frontend/`.
5. In the editor, search `frontend/src/` for the text `package.json` → there are no matches; search for `9.8.7` and `0.1.0` → no matches in any `.ts` or `.tsx` file (the version is typed nowhere in the frontend).
6. Restore `version = "0.1.0"` in `backend/pyproject.toml`, save, run `docker compose up -d --build backend` again, reload the page → the footer reads `Task Notes v0.1.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap.
Prerequisites: the stack from criterion 1 is running and the footer reads `Task Notes v0.1.0`.
1. From the repository root run `docker compose stop backend` → the `backend` container stops; `curl -s http://localhost:8010/api/version` now prints a connection-refused error.
2. Reload `http://localhost:5183` → the page loads (the notes list is empty and the form is still usable) and the footer reads exactly `Task Notes · version unavailable`: no `v`, no `undefined`, no `null`, no blank area after the name.
3. In dev tools, Elements panel, select the footer → `<footer data-testid="app-footer">` contains the text "Task Notes", a `<span data-testid="app-footer-version-unavailable">` with the text `version unavailable`, and no `app-footer-version` element.
4. In dev tools, Network panel → the request to `http://localhost:8010/api/version` is shown as failed (status `(failed)` or `ERR_CONNECTION_REFUSED`).
5. Loading state: in the Network panel set throttling to "Slow 3G", then reload → for the first moments the footer reads exactly `Task Notes` (no `v`, no "version unavailable"), and once the request completes it reads `Task Notes v0.1.0`. Set throttling back to "No throttling". If the transition is too fast to see, the loading state is pinned by the component test in criterion 4 step 1 and by E2E spec 4.
6. Run `docker compose start backend`, wait for `curl -s http://localhost:8010/api/version` to print `{"version":"0.1.0"}`, reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths: version present, and version absent.
Prerequisites: `cd frontend && npm install` done; no running stack needed for steps 1 to 3.
1. Open `frontend/src/components/AppFooter.test.tsx` in the editor → it mocks `../api/version` and contains one test whose `getVersion` mock resolves `"1.2.3"` (asserting footer text `Task Notes v1.2.3` and an `app-footer-version` span reading `v1.2.3`), one whose mock rejects (asserting footer text exactly `Task Notes · version unavailable`, no `undefined`, no `null`, no `app-footer-version` element) and one whose mock never settles (asserting footer text exactly `Task Notes`).
2. From `frontend/`, run `npx vitest run src/components/AppFooter.test.tsx` → every test in the file passes, 0 failures.
3. From `frontend/`, run `npm test` → the whole Vitest suite passes, including `src/api/version.test.ts` (the client rejects on a 500 and on a body without a `version` string) and the updated footer case in `LandingPage.test.tsx`.
4. With the stack from criterion 1 running, from the repository root run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` → all eight specs pass: TEST-08's happy path shows the backend's version, its three edge specs show `Task Notes · version unavailable` (abort, 500) and `Task Notes` (held request), and TEST-04's four specs pass against the backend's version rather than `frontend/package.json`.
