# Shared Risk Analysis, TEST-04

Planned against the code as it actually stands in this worktree, whose branch `feature/TEST-04-page-footer` is cut from `origin/main` at `d4c74d4`. At that commit `frontend/src/components/LandingPage.tsx` is the plain TEST-01 landing page: container `<div>`, `<header>` with the `landing-title` `<h1>`, `<main>` with the subtitle `<p>`, and nothing else. TEST-03's earlier build *was* merged (PR #3) and then deliberately reverted on main by `4c53156 chore: reset TEST-03 to pre-build state`, so the notes section is genuinely absent from this base and TEST-03 is back at `status: todo` with a fresh build in flight.

## Files this feature will create

- `frontend/src/components/AppFooter.tsx`
- `frontend/src/components/AppFooter.test.tsx`
- `e2e/tests/TEST-04_page_footer.spec.ts`
- `e2e/uat/scenarios/TEST-04_page_footer.feature`
- `e2e/uat/scripts/TEST-04_page_footer_uat_script.md`

None of these paths exists on `origin/main` or on any other item's in-flight branch, so all five are conflict-free creations.

## Existing files this feature will modify

- `frontend/src/components/LandingPage.tsx`: add the `AppFooter` import and render `<AppFooter />` as the last child of the container `<div>`, immediately after `</main>`. Two insertions, no deletions, no edits to existing styles, texts, or `data-testid` values.
- `frontend/src/components/LandingPage.test.tsx`: add one test asserting the footer renders inside the page. The three existing tests are untouched.

`frontend/package.json` is **read** (the `version` field is imported) but not modified — the item does not bump the version.

## Potential conflicts with other independent features

### TEST-03 (Simple note form) — real conflict, same two files, PR open and unmerged

`feature_map.md` already flags this pair (`⚠️ TEST-04 and TEST-03 both modify frontend/src/components/LandingPage.tsx; serialize if run concurrently`). Inspecting the open branch `origin/feature/TEST-03-simple-note-form` (tip includes `3cef6e1 feat(TEST-03): implement frontend components`) makes the overlap concrete:

- **`frontend/src/components/LandingPage.tsx` — both branches edit the same region.** TEST-03 adds three `CSSProperties` consts directly above `function LandingPage()`, a `useNotes()` hook call inside it, and a `<section data-testid="notes-section">` as the **last child of `<main>`**, ending on the line before `</main>`. TEST-04 adds its `<AppFooter />` on the line **after** `</main>`. The two insertions are adjacent, and both also add an import at the top and a style const in the same block, so git will very likely report a conflict rather than merge cleanly. Whichever PR merges second must rebase and re-resolve by hand.
- **`frontend/src/components/LandingPage.test.tsx` — both branches edit it, and the second one inherits a changed test setup.** TEST-03 rewrites this file substantially (+41/−5) and makes `LandingPage` depend on `useNotes`, which performs a fetch. After TEST-03 merges, rendering `<LandingPage />` in a test needs whatever mocking TEST-03 introduces. **Consequence:** if TEST-04 merges second, its added footer test must be re-based onto TEST-03's setup (or the footer assertion moved to `AppFooter.test.tsx`, which is self-contained and needs no mocking at all — that file is the safe place for the substance of the assertion, and the `LandingPage.test.tsx` case should stay a one-line "footer is present" check precisely so it is cheap to re-resolve).
- **Semantic risk in the merge resolution, not just a textual one.** Once TEST-03 lands, `<main>` contains the notes `<section>`. The footer must still sit **outside** `<main>` — a resolution that tucks `<AppFooter />` inside `<main>` alongside the notes section compiles and renders identically but silently drops the `contentinfo` accessibility role, failing acceptance criterion 2 and the role assertions in both `AppFooter.test.tsx` and `e2e/tests/TEST-04_page_footer.spec.ts`. Whoever resolves the conflict must check that `<AppFooter />` is a sibling of `<header>`/`<main>`, not a child of `<main>`.
- **A conflict this plan deliberately avoids:** TEST-03 also adds `frontend/src/vite-env.d.ts`. The rejected version-plumbing routes for TEST-04 (Vite `define` needing an ambient `declare const __APP_VERSION__`, or `import.meta.env.VITE_APP_VERSION` needing an `ImportMetaEnv` declaration) would both have landed in exactly that file — see `plan.md` → Assumptions A1. The chosen named JSON import keeps TEST-04 out of `vite-env.d.ts` entirely, removing a second overlap the naive approach would have created.

**Dispatch advice (assisted mode, so this is advice rather than enforcement):** TEST-04 and TEST-03 should not be *built* concurrently. Planning them concurrently is safe — the plan artifacts are in disjoint directories. TEST-03 is neither merged nor a dependency of TEST-04, so TEST-04 can be built and merged first; the resulting `LandingPage.tsx` conflict then lands on TEST-03's rebase instead, which is the cheaper direction because TEST-03's diff to that file is already large and being re-resolved anyway.

### TEST-02 (Health endpoint) — no overlap, by design

TEST-02 is backend-only: `backend/app/main.py`, a router, and its pytest suites. TEST-04 touches no file under `backend/`, adds no endpoint, and needs no API. The two file sets are disjoint and the items can be planned and built fully in parallel — which is the reason TEST-04 was written this way. TEST-02's own shared-risk note pairs it with TEST-03 over the FastAPI app entry (router registration); TEST-04 is not part of that pair.

### Shared infrastructure files — untouched

- `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/package.json`, `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/setupTests.ts`: not modified (a consequence of Assumptions A1; if the builder edits any of them, the plan's decision has been abandoned and the conflict surface widens).
- `playwright.config.ts`, `docker-compose.yml`, `.github/workflows/*`, `.env.example`: not modified.
- `e2e/tests/TEST-01_static_landing_page.spec.ts`: not modified, and must keep passing — it is the regression gate for acceptance criterion 3.
