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
>
> (ClickUp task 123k99ctgch, workspace 30307190. A tracker comment amends criterion 2 and the "frontend only" note; see Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **As amended by the tracker comment:** that source is the backend, read at runtime from `GET /api/version`, not `frontend/package.json` at build time. A frontend bundle served against a backend of another version shows the backend's version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. (Covers the request still pending, the request failing, and the backend reporting `unknown`; see the state decision below.)
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the plan's single declared source changes from `frontend/package.json` to `GET /api/version`, fetched at runtime by a new client `frontend/src/api/version.ts`. `AppFooter.tsx` stops importing `frontend/package.json`. The comment overrides criterion 2's "frontend package metadata or a build-time variable", which is restated above. **The endpoint is not added: it already exists on main.** TEST-05 (a declared dependency of this item, done) delivered `GET /api/version` in `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`. It returns `{"version": "<backend/pyproject.toml version>"}` from package metadata, and `backend/tests/integration/test_version_integration.py` already covers it. Checked against the code at plan base f7e2be6. The plan reuses that endpoint unchanged.
- Comment (tracker), same comment: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by this recorded decision. **Loading state (before the fetch settles): the footer shows `Task Notes`, with no version segment.** **Failure state (network error, non-OK status, unexpected response shape): the footer shows `Task Notes`, with no version segment.** The footer is never blank and never reads `unknown`, `undefined`, `null`, `v` or `vundefined`. Reasons: criterion 3 already decides the unresolved case ("renders without it rather than … an empty gap"), so the footer keeps the app name and omits only the version. Showing `unknown` would put a word that looks like a version where none was resolved, which is the misleading answer the comment warns about. Loading and failure look the same on purpose: there is no spinner and no "loading…" text, because the request is one small GET and a flash of placeholder text would be the only visible artefact. **Assumption, recorded:** the backend's own sentinel `unknown` (returned by `version_service.get_app_version()` when the distribution metadata is missing) is treated as "cannot be resolved" too, and renders as `Task Notes`, so the footer never reads `Task Notes vunknown`. A blank or whitespace-only `version` string is treated the same way.
- Comment (tracker), same comment: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: the amended item does depend on the backend at runtime, so it is no longer frontend-only in behaviour. A frontend served without a reachable backend now shows `Task Notes` alone. **It makes no backend code change**, because the endpoint the comment asks for already shipped in TEST-05. That is why `## Backend Plan` reads "No backend changes required" and the manifest has no `[B]` entry. Plan Overview and Backend Plan say so in prose, and the description's note "Touches no backend file" still holds literally.
- Description note "It modifies `LandingPage.tsx`" → not acted on. `LandingPage.tsx` already renders `<AppFooter />` (TEST-04), and this item's change lives inside `AppFooter.tsx`, so `LandingPage.tsx` is not modified. The shared-risk flag against BUG-04 on that file does not materialize (see `shared_risks.md`).
- Other tracker comments (framework "PR opened" notices from earlier runs whose code was reset, and an operator note about a past state reset) → not acted on because they carry no requirement. The dispatch flagged them as not actionable.

## Plan Overview
The footer that TEST-04 built (`frontend/src/components/AppFooter.tsx`, rendering `Task Notes v{version}` from `frontend/package.json`) is changed to show the **backend's** version, fetched at runtime from the existing `GET /api/version` (TEST-05).

- A new API client module, `frontend/src/api/version.ts`, owns the request (coding_standards.md Section 4, applied to this project's own backend as `notes.ts` already does: a dedicated client layer, no `fetch` in components).
- The API base URL, currently a private constant inside `frontend/src/api/notes.ts`, moves to `frontend/src/api/baseUrl.ts` so both clients read one value from one source (coding_standards.md, the configuration rule "one value, one source"). `notes.ts` imports it, and its behaviour is unchanged.
- `AppFooter.tsx` fetches once on mount and renders `Task Notes v{version}` when resolved. While the fetch is pending, or after it fails, it renders `Task Notes` alone.

**Layers: frontend only in code. The item does gain a runtime dependency on the backend** (the tracker comment's point): it reuses TEST-05's endpoint, and no backend file is created or modified. TEST-04's E2E spec and UAT artifacts assert the old `frontend/package.json` source, so they are updated to the new source; otherwise they would fail, or describe a behaviour that no longer exists.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `../../package.json` import. Add `const [version, setVersion] = useState<string | null>(null)`. A `useEffect` on mount calls `fetchBackendVersion()`, sets the result on resolve, and sets `null` on reject. It uses the same `isMounted` guard `LandingPage.tsx` uses, so an unmounted footer never sets state. Render `<footer data-testid="app-footer" style={footerStyle}>{APP_NAME}{version !== null && <span data-testid="app-footer-version">{` v${version}`}</span>}</footer>`. The version segment, including its leading space, exists only when a version resolved, so the unresolved footer's text is exactly `Task Notes`, with no trailing space and no `v`. The `<footer>` element, its `data-testid="app-footer"` and `footerStyle` are unchanged (TEST-04 criterion 2 still holds).
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. It sends `GET ${API_BASE_URL}/api/version`. A non-OK response throws `Error("Loading the version failed: {status} {statusText}")`, matching `notes.ts`'s `requestFailed` wording. A body that is not an object with a string `version` throws `Error("Loading the version failed: unexpected response shape")`. A `version` that is blank after trim, or equals the backend sentinel `UNRESOLVED_BACKEND_VERSION = "unknown"`, returns `null`. Otherwise it returns the trimmed version string. Extra response fields (TEST-09 adds `commit`) are ignored. A network error propagates as the rejected `fetch` promise. Export a `BackendVersion` response type, `{ version: string }`, and use no `any`.
  - `frontend/src/api/baseUrl.ts` (new): `export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";`, moved verbatim from `notes.ts` with its default, plus a one-line comment explaining why it is shared.
  - `frontend/src/api/notes.ts` (modify): delete its local `DEFAULT_API_BASE_URL` and `API_BASE_URL`, and import `API_BASE_URL` from `./baseUrl`. No other change. Its existing test, including the `VITE_API_BASE_URL` override test (`vi.resetModules` then a dynamic import of `./notes`), keeps passing, because the reset re-evaluates `baseUrl.ts` too.
- Routes: none (the footer is on `/`, already rendered by `LandingPage.tsx`, which is unchanged).
- State management: local component state (`useState` plus `useEffect`) in `AppFooter`. No global store, no context, no retry, no polling (scope containment: none is asked for).
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep TEST-04's existing footer values unchanged: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`. The version `<span>` adds no style of its own and inherits them. Display format `Task Notes v{version}` (TEST-04's existing `v` prefix), e.g. `Task Notes v0.1.0`.

## Backend Plan
No backend changes required.

The tracker comment asks for a `GET /api/version` endpoint returning the backend's version. That endpoint already exists on main from TEST-05, a declared dependency of this item: `backend/app/routers/version.py` (registered in `backend/app/main.py`), `backend/app/services/version_service.py` (reads `task-notes-backend` package metadata, falls back to `unknown`) and `backend/app/schemas/version.py` (`{"version": str}`). It is already covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. CORS already allows `GET` from `http://localhost:5183` (`backend/app/main.py`, `backend/app/core/config.py`). This item is a runtime consumer of that endpoint and edits none of those files.

## API Integration Plan
No external API integration. The footer consumes this project's own backend through the internal API contract below.

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version` (existing, TEST-05; unchanged by this item)
- Request: no body, no query parameters, no auth.
- Response: `200 OK`, `application/json`, example `{"version": "0.1.0"}`. `version` is the backend's `[project].version` from `backend/pyproject.toml`, or the string `unknown` when the backend cannot read its package metadata. The client tolerates and ignores additional fields (TEST-09 adds `commit`).
- Client-side interpretation (`fetchBackendVersion`): a 200 response with a non-blank string `version` other than `unknown` gives that string, displayed as `Task Notes v{version}`. A 200 response whose `version` is `unknown` or blank gives `null`, displayed as `Task Notes`. A non-OK status, a malformed body or a network error throws, and the footer catches it and displays `Task Notes`.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the platform `fetch` API, the same as `notes.ts`, over adding an HTTP library such as axios. `fetch` covers one GET with JSON parsing, and the project installs no HTTP client.
- `frontend/src/api/baseUrl.ts` (shared base URL): chose a 1-line module re-using Vite's built-in `import.meta.env` over a config library, or a second copy of the constant inside `version.ts`. Vite already provides env injection, and a second copy would give one value two sources (coding_standards.md, "one value, one source").
- Footer loading and failure state: chose React's built-in `useState` and `useEffect`, as `LandingPage.tsx` already does, over a data-fetching dependency (react-query, SWR). One fire-once GET needs no cache, retry or deduplication.
- Response-shape check: chose a few lines of `typeof` checks in `version.ts` over a schema library such as zod. The shape is one string field, and the project installs no validator.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL (`VITE_API_BASE_URL`, default `http://localhost:8010`), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, returning the version, `null` for unresolved (`unknown` or blank), or throwing on non-OK, malformed or network failure
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client, with `fetch` stubbed (same pattern as `notes.test.ts`)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec; the footer shows the backend's version (from `backend/pyproject.toml`) and not the frontend's (`frontend/package.json`); edge case: an aborted `/api/version` request leaves exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render `Task Notes v{version}` when resolved, `Task Notes` alone while pending or on failure; the version sits in a `data-testid="app-footer-version"` span
- [A] frontend/src/components/AppFooter.test.tsx: replace the "version imported from package.json" test with tests for the resolved, pending, rejected and `null` (unknown) paths, mocking `../api/version`; keep the app-name and contentinfo-landmark tests
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it locally; no behaviour change
- [D] e2e/tests/TEST-04_page_footer.spec.ts: the version assertions read the expected value from `backend/pyproject.toml` instead of `frontend/package.json`, because the footer's version source changed; the heading, subtitle, landmark and mobile-viewport assertions are unchanged
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the "matches the version field of frontend/package.json" step now reads the backend's version (`GET /api/version`), so the TEST-04 scenario no longer describes a source that was removed
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the same correction to its expected-version step

No dependency is added or changed, so no lockfile (`frontend/package-lock.json`, `backend/uv.lock`, root `package-lock.json`) is modified. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15's condition). `docs/DEVELOPMENT.md` already describes the footer reading `GET /api/version` at runtime and showing `Task Notes` alone while pending, on failure, or for an `unknown` version, which matches this plan. Its commit-suffix half describes TEST-10, which is outside this item's scope. `frontend/src/components/LandingPage.tsx` is not modified (see Re-Plan Feedback), and no backend file is modified (see Backend Plan).

## Testing Strategy
- Unit tests (Vitest, colocated `*.test.ts(x)` beside the module, per the existing frontend convention; the backend's `backend/tests/unit/` and `test_{module}_unit.py` naming do not apply, because no backend code changes):
  - `frontend/src/api/version.test.ts`, with `fetch` stubbed via `vi.stubGlobal` as `notes.test.ts` does:
    - Happy path: `{"version": "0.1.0"}` resolves to `"0.1.0"` and calls `http://localhost:8010/api/version` once.
    - Extra fields are ignored: `{"version": "0.1.0", "commit": "abc"}` resolves to `"0.1.0"`.
    - Edge cases: `"unknown"` resolves to `null`, and `"  "` resolves to `null`.
    - Error cases: a 500 response rejects with `Loading the version failed: 500 Internal Server Error`; `{}` or `{"version": 1}` rejects with the unexpected-shape message; a rejected `fetch` propagates.
    - `VITE_API_BASE_URL` override: `vi.stubEnv`, then `vi.resetModules`, then a dynamic import; it calls `https://notes.example.test/api/version`.
  - `frontend/src/components/AppFooter.test.tsx`, with `vi.mock("../api/version")`:
    - Resolved `"0.1.0"`: `findByTestId("app-footer-version")` has text ` v0.1.0`, and the footer text is `Task Notes v0.1.0` (criteria 1 and 4: present path).
    - Pending (a never-settling promise): the footer text is exactly `Task Notes`, and `app-footer-version` is absent (criteria 3 and 4: loading).
    - Rejected: after the rejection settles (`waitFor`), the footer text is exactly `Task Notes`, `app-footer-version` is absent, and the text contains none of `undefined`, `null` or `unknown` (criteria 3 and 4: absent path).
    - Resolved `null`: same as rejected (criterion 3: backend sentinel).
    - Source: `fetchBackendVersion` is called once on mount; the rendered version equals the mocked value `"9.9.9"`, not the `frontend/package.json` value (criterion 2).
    - Keep: renders `Task Notes`; contentinfo landmark with `data-testid="app-footer"`.
  - Directory: colocated under `frontend/src/` (frontend convention; `CLAUDE.md`'s `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: none new. The only API involved is `GET /api/version`, unchanged and already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, no database needed, 405 on POST). This item adds or modifies no endpoint, repository or model, so `testing_standards.md` Section 6 warrants no new integration tier.
  - Directory: backend/tests/integration/ (untouched)
- E2E tests:
  - `e2e/tests/TEST-08_footer_app_version.spec.ts`:
    - (1) Go to `/`; `getByTestId("app-footer")` contains `Task Notes v{backendVersion}`, where `backendVersion` is read from `backend/pyproject.toml` in the spec (the same parsing approach `test_version_integration.py` uses, via `readFileSync` and a `^version = "…"` match in the `[project]` table). It does **not** contain `v{frontend/package.json version}`; today the two differ (`0.1.0` against `0.0.0`), which is what makes the assertion meaningful.
    - (2) Edge case: `page.route("**/api/version", (route) => route.abort())` before `goto("/")`; `getByTestId("app-footer")` has text exactly `Task Notes`, and `getByTestId("app-footer-version")` has count 0.
  - `e2e/tests/TEST-04_page_footer.spec.ts`: switch its expected version from `frontend/package.json` to `backend/pyproject.toml`.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge case, in `e2e/uat/scenarios/TEST-08_footer_app_version.feature`, with the manual script expanded from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source, the backend's `GET /api/version` at runtime (amended), never typed into the component | Unit | Verifying the source needs no navigation or interaction: it is a wiring property. The client test proves the URL called and the parsing; the component test proves the footer renders the client's value and not `package.json`'s. Criterion 1's E2E spec additionally shows the backend's `0.1.0` and not the frontend's `0.0.0` end to end. |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`, `null` or empty gap) | Unit | It is a rendering rule over three client outcomes (pending, rejected, `null`), each set directly by mocking the client, with no navigation or interaction. The E2E edge-case spec (aborted request) is the feature's required edge-case spec, not the covering tier. |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion is itself a requirement on the component test (`AppFooter.test.tsx`); it is satisfied by that file's existing, passing tests, not by browser behaviour. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `goto("/")`; `app-footer` contains `Task Notes v{backend/pyproject.toml version}` | Given the full stack is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage (E2E spec 1 also asserts the frontend's `package.json` version is absent) | Given the backend reports version 0.1.0 and the frontend package declares 0.0.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage (E2E edge-case spec: aborted `/api/version` gives exactly `Task Notes`) | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" with no "v", "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component tests, Then they pass with 0 failed, including a version-present and a version-absent case |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build` (services `db`, `backend`, `frontend`); `backend/pyproject.toml` declares `version = "0.1.0"`.
1. Open `http://localhost:5183/` in a browser → the "Task Notes" heading, the note form and the saved-notes list are shown, and a footer is at the bottom.
2. Read the footer text → it reads exactly `Task Notes v0.1.0`.
3. Resize the window to 375px wide (DevTools device toolbar, "iPhone SE") → the footer is still visible and still reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, never a string typed into the component
Prerequisites: same as Criterion 1.
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}`.
2. Open `frontend/package.json` in an editor → its `"version"` field is `"0.0.0"`.
3. Open `http://localhost:5183/`, open DevTools → Network, filter on `version`, and reload → one `GET http://localhost:8010/api/version` request with status 200 appears, and the footer reads `Task Notes v0.1.0`, the backend's version and not `0.0.0`.
4. Open `frontend/src/components/AppFooter.tsx` → there is no `package.json` import and no version literal such as `"0.1.0"`; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: same as Criterion 1.
1. Run `docker compose stop backend` from the repo root → the command reports the `backend` container stopped.
2. Open `http://localhost:5183/` and hard-reload (Cmd+Shift+R) → the page renders, and the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing blank space where a version would be.
3. In DevTools → Elements, inspect the footer → the `<footer data-testid="app-footer">` element contains only the text `Task Notes`, and no `app-footer-version` span exists.
4. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers `{"version":"0.1.0"}`, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.
5. Loading state: in DevTools → Network, set throttling to "Slow 3G" and reload `http://localhost:5183/` → until the `/api/version` request completes, the footer reads exactly `Task Notes`; when it completes, it changes to `Task Notes v0.1.0` and never shows a placeholder word in between. Reset throttling to "No throttling".

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repo root → the run lists `AppFooter.test.tsx` and `version.test.ts` and reports 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → there is a test where the mocked client resolves a version and the footer shows `Task Notes v{version}`, and a test where it rejects (and one where it resolves `null`) and the footer shows exactly `Task Notes` with no `app-footer-version` element.
