# Implementation Plan, TEST-04: Page footer with app version

## Feature

> Add a footer to the landing page showing the application name and its version, read from `frontend/package.json` rather than hardcoded. Frontend only; no backend or database work. Deliberately trivial, and deliberately disjoint from TEST-02's backend files so the two can run concurrently in a batch.

Source: `docs/issues/TEST-04.md` (local work item, `hybrid` source; no tracker twin was consulted).

## Acceptance Criteria

- [ ] 1. The landing page renders a footer containing the application name and the version string from `frontend/package.json`.
- [ ] 2. The footer is a semantic `<footer>` element and carries a `data-testid` so E2E specs can target it.
- [ ] 3. The existing landing-page heading and subtitle, and their `data-testid` values, are unchanged.

## Plan Overview

One new presentational React component, `frontend/src/components/AppFooter.tsx`, rendering `<footer data-testid="app-footer">Task Notes v{version}</footer>`, where `version` is a **named import** from `frontend/package.json`. `LandingPage.tsx` renders it as the last child of its existing container `<div>`, after `<main>`, and is otherwise untouched. Frontend only: no backend, no database, no API, no new dependencies, no config changes. Tests: Vitest unit tests for the new component plus an added footer assertion in the existing `LandingPage.test.tsx`, one Playwright E2E spec, and UAT Gherkin + manual script. Integration tests are not warranted (see Testing Strategy).

## Assumptions & Decisions

Recorded per `user_story_alignment.md` Section 2 (document the assumption, do not block). The builder must carry these into the PR description.

### A1. The version reaches the component via a named JSON import — `import { version } from "../../package.json"`

This is the load-bearing decision the item leaves open. Three routes were evaluated against the *actual* config in this worktree:

| Route | Verdict | Consequence |
| --- | --- | --- |
| **`import { version } from "../../package.json"`** (chosen) | Works with **zero** config change | `frontend/tsconfig.json` already sets `"resolveJsonModule": true`, and it is **not** a composite project, so a file outside its `"include": ["src"]` is legally pulled into the program by the import. Vite's JSON plugin emits named exports, so Rollup tree-shakes everything except the version string out of the production bundle. Works identically under `vite dev`, `vite build` (`tsc -b` type-check included) and Vitest, with no extra plumbing. |
| Vite `define: { __APP_VERSION__: ... }` in `vite.config.ts` | Rejected | Reading `./package.json` inside `vite.config.ts` puts that file under `tsconfig.node.json`, which **is** `"composite": true` and does **not** set `resolveJsonModule`. Composite projects must list every file they include, so the import fails type-check (TS6307 / missing-JSON-module) unless `tsconfig.node.json` is edited too. It additionally needs an ambient `declare const __APP_VERSION__: string` and relies on Vitest honouring `define`. Three moving parts against zero, for no benefit. |
| `import.meta.env.VITE_APP_VERSION` | Rejected | Vite only exposes `VITE_*` variables that already exist in the environment, so the version would have to be written into a `.env` file (hardcoding it, which criterion 1 forbids) or injected by a wrapper npm script. It is also `undefined` under Vitest unless stubbed, and typed `string | undefined` without a declaration file. |

**Binding constraint for the builder:** use the **named** import (`import { version } from ...`), never a default-object import (`import pkg from ...`). A default import defeats tree-shaking and ships the whole manifest — dependency names, scripts, the `private` flag — into the client bundle.

**Trade-off accepted:** the import path escapes `frontend/src/`, so `tsc -b` type-checks one file outside the `include` glob. Harmless here (`noEmit: true`, no `rootDir`, non-composite), but it would break if `frontend/tsconfig.json` is ever made composite or given a `rootDir`. Do not make that change as part of this item.

### A2. The displayed application name is the literal "Task Notes"

`frontend/package.json` → `name` is `task-notes-frontend`, which is a package identifier, not a display name. The footer uses `Task Notes`, matching the existing `<h1>`, held in a module-level `APP_NAME` constant in `AppFooter.tsx`.

### A3. Rendered text format: `Task Notes v0.0.0`

`{APP_NAME} v{version}`. `frontend/package.json` → `version` is currently `0.0.0`, so the footer reads `Task Notes v0.0.0` today. **No test may assert that literal**: unit and E2E tests derive the expected string from `package.json` itself, so a future version bump does not turn green tests red.

### A4. The subtitle has no `data-testid` today, and does not gain one

Criterion 3 says the heading's and subtitle's `data-testid` values are unchanged. In the current `LandingPage.tsx` only `landing-page` and `landing-title` exist; the subtitle `<p>` carries none. "Unchanged" is therefore satisfied by leaving it without one. Adding one would be gold plating (`user_story_alignment.md` Section 3).

### A5. Frontend unit tests are colocated, not in the `CLAUDE.md` unit test directory

`CLAUDE.md` → Test Configuration → Unit test directory (`backend/tests/unit/`) and naming (`test_{module}_unit.py`) are pytest/backend-shaped. The frontend convention established by TEST-01 is a colocated `{Component}.test.tsx` beside the component, run by `vitest run`. This item follows that precedent; no Vitest file goes anywhere near `backend/`.

### A6. Styling stays inline `CSSProperties`, and i18n is not introduced

No CSS framework and no icon library are configured, and Design Reference mode is `NONE`. `LandingPage.tsx` uses module-level `CSSProperties` constants; `AppFooter.tsx` matches that. `coding_standards.md` Section 3.3 asks that strings be i18n-ready; there is no i18n infrastructure in this project and TEST-01 uses literals, so the literals live in named constants and the deviation is noted here rather than "fixed" by adding an i18n layer (out of scope).

## Frontend Plan

- **Components to create:**
  - `frontend/src/components/AppFooter.tsx` — a props-less functional component returning a single semantic `<footer data-testid="app-footer">` whose text is `` `${APP_NAME} v${version}` ``. Module-level `CSSProperties` const for styling (small font, muted `#5f5f5f` matching the existing subtitle, top margin, `marginTop: "auto"` is **not** used — see the layout note below). One component per file, functional, no state, no hooks, no effects.
- **Components to modify:**
  - `frontend/src/components/LandingPage.tsx` — add the import and render `<AppFooter />` as the **last child of the existing container `<div>`**, i.e. a sibling of `<header>` and `<main>`, after `</main>`. Nothing else changes: `containerStyle`, `titleStyle`, `subtitleStyle`, the `landing-page` and `landing-title` test ids, the `<h1>` text and the subtitle text all stay byte-identical.
- **Layout note (constraint, not decoration):** the `<footer>` must **not** be nested inside `<main>`, `<article>`, `<section>`, `<nav>` or `<aside>`. A `<footer>` scoped to a sectioning element loses the `contentinfo` accessibility role, and both the unit test and the E2E spec assert that role (see Testing Strategy). As a direct child of the container `<div>` it keeps `contentinfo`.
- **Routes:** none. The app has no router; `App.tsx` renders `LandingPage` directly and is not modified.
- **State management:** none. The version is resolved at build time; there is no runtime state, no fetch, no context.
- **Accessibility:** the footer contains only descriptive text and no interactive elements, so no `aria-label` is required (`coding_standards.md` Section 3.2). The semantic `<footer>` supplies the `contentinfo` landmark. Text colour `#5f5f5f` on the white background keeps contrast above the 4.5:1 AA threshold, consistent with the existing subtitle.
- **Responsiveness:** the existing container is already a mobile-first centred flex column; the footer inherits it and needs no media query or responsive prefix. Verified by a mobile-viewport E2E case.
- **Design reference notes:** Design Reference mode is `NONE` — AI freestyle, matched to the existing `LandingPage.tsx` idiom (inline `CSSProperties`, system font stack, muted secondary text). No new visual system is introduced.

## Backend Plan

No backend changes required. This item touches no file under `backend/`, adds no endpoint, service, repository, model, schema, or migration. This is deliberate: the item exists so its file set is disjoint from TEST-02's backend work.

## API Integration Plan

No external API integration.

## API Contract

No API contract. Nothing crosses a process boundary: the version string is inlined into the bundle at build time from `frontend/package.json`, so there is no request, no response, and no client-server interaction to specify.

## File Manifest

### New files

- `frontend/src/components/AppFooter.tsx`: the footer component — semantic `<footer data-testid="app-footer">`, `APP_NAME` constant, named `version` import from `../../package.json`, inline `CSSProperties` style const.
- `frontend/src/components/AppFooter.test.tsx`: Vitest unit tests for `AppFooter` (renders app name, renders the version derived from `package.json`, exposes the `contentinfo` role, carries the `app-footer` test id).
- `e2e/tests/TEST-04_page_footer.spec.ts`: Playwright spec covering all three acceptance criteria plus a mobile-viewport edge case.
- `e2e/uat/scenarios/TEST-04_page_footer.feature`: Gherkin scenarios, one per acceptance criterion plus one edge case.
- `e2e/uat/scripts/TEST-04_page_footer_uat_script.md`: manual clickthrough script with pass/fail checkboxes.

### Modified files

- `frontend/src/components/LandingPage.tsx`: import `AppFooter` and render `<AppFooter />` as the last child of the container `<div>`, after `</main>`. No other edit — existing styles, texts, and `data-testid` values are untouched.
- `frontend/src/components/LandingPage.test.tsx`: add one test asserting the landing page renders the footer (`app-footer` present, and its text contains the version from `package.json`). The three existing tests stay exactly as they are; they are the regression guard for criterion 3.

**Not modified, deliberately:** `frontend/package.json` (read only — the version is not bumped by this item), `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/src/App.tsx`, `playwright.config.ts`, anything under `backend/`, `docker-compose.yml`. If the builder finds itself editing a config file, decision A1 has been abandoned and the plan needs revisiting rather than extending.

## Testing Strategy

- **Unit tests (Vitest, warranted):** the item adds a rendering component, so component-level unit tests are the primary tier.
  - Directory: colocated with the component, `frontend/src/components/` (per assumption A5 — `CLAUDE.md`'s `backend/tests/unit/` and `test_{module}_unit.py` are the pytest conventions and do not apply to frontend tests).
  - Naming: `AppFooter.test.tsx`, matching the TEST-01 precedent `LandingPage.test.tsx`.
  - `AppFooter.test.tsx` cases: (a) happy path — renders text containing `Task Notes`; (b) renders the version **imported from `../../package.json`**, asserted against that import and never against a `0.0.0` literal; (c) edge/semantic case — the element is exposed as the `contentinfo` landmark (`getByRole("contentinfo")`) and carries `data-testid="app-footer"`.
  - `LandingPage.test.tsx`: one added case asserting the footer renders inside the page; the existing three cases are left untouched and serve as the criterion-3 regression check.
  - **On the "one error case" rule** (`coding_standards.md` Section 2.4, `testing_standards.md` Section 1.1): there is no error path to test. The component takes no props, performs no I/O, and its only input is a build-time constant, so it has no failure mode that could be provoked without mocking the module system. Stating this explicitly rather than fabricating a throw-case test. Likewise the 80% business-logic coverage target has no subject here: the component contains no business logic.
  - Run via the existing `cd frontend && npm test` (`vitest run`), part of the `CLAUDE.md` test gate command.
- **Integration tests: not warranted.** Every trigger in `testing_standards.md` Section 6 that selects this tier — repository code, database models, migrations, API endpoints — is absent: this item adds one presentational React component and touches no backend file, so there is nothing to exercise against real infrastructure. (The `Integration Tests` toggle stays ENABLED for the project; this is a per-item judgement, not a toggle change, and no file under `backend/tests/integration/` is added or modified.)
- **E2E tests (Playwright, warranted and ENABLED):** the acceptance criteria are user-facing and visual.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-04_page_footer.spec.ts` (per `CLAUDE.md` naming `{feature_id}_{slug}.spec.ts`).
  - Locators: `data-testid` first (`app-footer`, `landing-title`, `landing-page`), accessibility role second (`contentinfo`) — never a bare CSS selector (`testing_standards.md` Section 1.3).
  - **Deriving the expected version in the spec:** read `frontend/package.json` from the spec with `readFileSync` + `JSON.parse` (the spec runs in Node, so this needs no dependency) and assert `toContainText(version)`. Do **not** hardcode `0.0.0`, and prefer this over a JSON `import` because the repository root has no `tsconfig.json` and the spec transform pipeline's JSON handling is not something this item should depend on.
  - Each spec is independent and needs no seeded data — the page is static, so `page.goto("/")` is the whole setup. Playwright's built-in waiting is used; no fixed timeouts. Screenshot-on-failure is already configured in `playwright.config.ts`.
- **UAT scenarios (warranted and ENABLED):**
  - Scenarios directory: `e2e/uat/scenarios/`, file `TEST-04_page_footer.feature`.
  - Scripts directory: `e2e/uat/scripts/`, file `TEST-04_page_footer_uat_script.md`.
  - One scenario per acceptance criterion plus one edge-case scenario (`testing_standards.md` Section 4). Verifies: the footer is visible at the bottom of the landing page with the app name and a version; the version shown matches `frontend/package.json` rather than a hardcoded string; the heading and subtitle are unchanged from before the feature. Per `testing_standards.md` Section 5, the Gherkin does not restate the E2E's interaction assertions — it is written from the stakeholder's viewpoint ("I can see which version is deployed").
- **Refactor gate:** ENABLED, and expected to be a near no-op — two small files, no duplication, no dead code. The one thing worth checking at that gate is that the footer's style const does not duplicate `subtitleStyle` verbatim; if it does, the shared muted-text values are the only candidate for extraction, and even then leaving them separate is acceptable under `coding_standards.md` Section 1 (beware hasty abstractions).
- **Security scanning:** DISABLED per `CLAUDE.md`. Nothing in this item handles input, credentials, or network traffic. One thing to keep in view anyway: the named-import constraint in A1 exists partly so the bundle does not gain the full `package.json` (dependency inventory), which is information disclosure, not just bundle bloat.

## Acceptance Test Outline

| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | The landing page renders a footer containing the application name and the version string from `frontend/package.json`. | `page.goto("/")`; `expect(page.getByTestId("app-footer")).toBeVisible()`; `toContainText("Task Notes")`; `toContainText(version)` where `version` is read from `frontend/package.json` with `readFileSync`/`JSON.parse` in the spec — never a hardcoded `0.0.0`. | Given the Task Notes app is running, When I open the landing page, Then I see a footer at the bottom showing "Task Notes" and a version, And that version matches the `version` field of `frontend/package.json`. |
| 2 | The footer is a semantic `<footer>` element and carries a `data-testid`. | `expect(page.getByTestId("app-footer")).toBeVisible()` for the test hook, plus `expect(page.getByRole("contentinfo")).toContainText(version)` — the `contentinfo` landmark is only exposed by a `<footer>` that is not scoped inside a sectioning element, so this assertion proves both the tag and its correct placement. | Given the landing page is open, When I inspect the page with a screen reader or the accessibility inspector, Then the footer is announced as a `contentinfo` landmark rather than as plain text. |
| 3 | The existing landing-page heading and subtitle, and their `data-testid` values, are unchanged. | `expect(page.getByTestId("landing-page")).toBeVisible()`; `expect(page.getByTestId("landing-title")).toHaveText("Task Notes")`; `expect(page.getByRole("heading", { name: "Task Notes" })).toBeVisible()`; assert the subtitle text is still present. These mirror `e2e/tests/TEST-01_static_landing_page.spec.ts`, which must also still pass unmodified — that spec is the real regression gate. | Given I know what the landing page looked like before this change, When I open it after the change, Then the title "Task Notes" and the subtitle are exactly as they were, And only the footer has been added. |
| Edge | (cross-cutting) The footer survives a small viewport. | `page.setViewportSize({ width: 375, height: 667 })` then `page.goto("/")`; assert the footer is still visible and still contains the version, mirroring the mobile case in the TEST-01 spec. | Given I open the app on a phone-sized screen, When the landing page loads, Then the footer with the app name and version is still readable and not cut off. |
