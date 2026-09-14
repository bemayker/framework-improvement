# Refactor gate report: TEST-08 (Footer shows the app version)

Run: deliver-20260914T095103Z | Phase F, build-feature Section 13 | branch `feature/TEST-08-footer-app-version`
Commit: `refactor(TEST-08): apply refactor gate findings`
Gate input: self-review verdict `PASS blocking=0 recommended=2 optional=1`. Both RECOMMENDED findings are mandatory input to this single pass (`review_standards.md` Section 6.3); this run has no later refactor pass.

## Findings

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/api/version.ts | The 5 s timeout is cleared when the response *headers* arrive (`finally` on the `fetch` await, old lines 62-66), so `await response.json()` reads the body with no timer armed. A backend that answers headers and then stalls the body leaves `fetchVersion()` pending forever and the footer pinned in `loading` — contradicting `VERSION_REQUEST_TIMEOUT_MS`'s own documented guarantee (old lines 12-14) | Excessive complexity / correctness of a documented contract | RECOMMENDED | **APPLIED (code fix arm).** The whole request — fetch, status check, body read, shape check — is wrapped in one `try { … } finally { clearTimeout(timeoutId) }`, so the timer stays armed across the body read. The `response.json()` catch now checks `controller.signal.aborted` first and raises the `timed out after 5000 ms` message instead of the misleading `the response body was not JSON` one. The duplicated timeout-message template is extracted to a `timedOutError()` helper (DRY, arising from the fix itself). The constant's comment is kept and tightened to say "headers *and* body". Regression test added as a case in the existing `frontend/src/api/version.test.ts` — **no new file** |
| 2 | e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md, .claude/artifacts/TEST-08/uat_script.md | Line 3 reads "Two steps read source files (2.4 and 4.2's reporter reading is not one of them)": it says two, names one, and explicitly excludes the only other candidate, so a tester hunts for a step that does not exist | Clean code (a comment that contradicts itself) | RECOMMENDED | **APPLIED.** Line 3 now reads "One step reads a source file (2.4; 4.2's reporter reading is not one of them)", keeping the parenthetical that rules 4.2 out. The identical edit was applied to **both** byte-identical copies; verified identical with `diff` after the write |

### Why the code arm was taken on finding 1

The reviewer offered an equally acceptable alternative: narrow the comment on the constant to say the timeout covers the response headers only. That arm was **declined**. It makes the documentation honest while leaving the hang it documents as impossible actually reachable — a backend that answers headers and stalls the body pins the footer in `loading` with no recovery, which is exactly the failure the constant exists to prevent. The code arm is eight lines of restructuring inside one function, is fully covered by a deterministic test, and leaves the constant's promise true. Shipping the current comment beside the current code was not an option on either arm.

### The OPTIONAL finding is not this gate's

`plan.md:54` records `- Design reference notes: AI freestyle` because `CLAUDE.md` → Design Reference is `NONE`. That is a gap in the plan, not in the code, and `review_standards.md` Section 6.1 keeps it OPTIONAL precisely because no recorded design value exists for a gate pass to apply. Nothing was changed for it; it goes to the PR description's known improvements.

## Gate's own checklist pass (`refactoring_standards.md` Section 3)

Scope: the five files named under `## Your files` in the Phase F handover manifest — `frontend/src/api/version.ts`, `frontend/src/api/version.test.ts`, `frontend/src/components/AppFooter.tsx`, `e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md`, `.claude/artifacts/TEST-08/uat_script.md`.

| Category | Result |
| --- | --- |
| 1. Naming consistency | No deviation. `camelCase` functions, `UPPER_SNAKE_CASE` constants, `PascalCase` component, file name matches component name |
| 2. DRY violations | One, created by finding 1's fix and resolved inside it: the timeout message template would otherwise have been written twice. Extracted to `timedOutError()` |
| 3. Dead code | None. No unused imports, no unreachable branch, no commented-out block |
| 4. Excessive complexity | `fetchVersion()` is 44 lines with one nesting level added by the `finally` wrapper; well inside the ~50 LOC guidance. `AppFooter` is a 45-line function component with one effect |
| 5. Layered-architecture drift | None. `AppFooter.tsx` calls no `fetch` directly; the client module owns the request, the component owns the state (`coding_standards.md` Section 4) |
| 6. Import hygiene | None. No wildcard, no cycle, no reach into another module's internals |
| 7. File & component structure | One component per file, one default export, name matches |

Nothing outside the two findings warranted a behaviour-preserving change, so nothing else was touched. In particular the stale `5173`/`8000` host ports in the **TEST-04** artifacts were left alone: the plan explicitly declined that change and the reviewer did not raise it, so acting on it would be scope expansion (`user_story_alignment.md` Section 3).

## Files created by this gate

**None.** Finding 1's regression test was added as a case inside the already-reviewed `frontend/src/api/version.test.ts`; no source or test file was created, so `review_standards.md` Section 6.4's post-gate re-check has nothing to cover on that account.

## Verification (`refactoring_standards.md` Section 5 rule 4)

| Check | Command | Result |
| --- | --- | --- |
| Frontend unit suite | `npm --prefix frontend test` | **41 passed, 0 failed, 0 skipped** across 6 files (`version.test.ts` 12, up from 11 with the new stalled-body case). No regression; the pre-existing timeout test still passes unchanged |
| Typecheck + production build | `npm --prefix frontend run build` (`tsc -b && vite build`) | Clean. 37 modules transformed |
| Settings consistency | `config-consistency.sh settings frontend/src/api/apiBaseUrl.ts` | exit 0 — "no environment accessor in this file, nothing to compare" (the accessor is `import.meta.env`, which this checker does not recognise; the module reads the environment with a documented default and is consistent by inspection) |

No revert was needed.
