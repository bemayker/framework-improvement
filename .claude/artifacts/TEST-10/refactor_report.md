# Refactor report: TEST-10

Gate result: 2 improvements applied (7 files examined)

Scope: frontend/src/api/version.ts, frontend/src/api/version.test.ts, frontend/src/components/AppFooter.tsx, frontend/src/components/AppFooter.test.tsx, frontend/src/components/LandingPage.test.tsx, docs/DEVELOPMENT.md, e2e/tests/TEST-08_footer_app_version.spec.ts

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | docs/DEVELOPMENT.md | Line 665 names the client as the one showing the commit in parentheses; AppFooter does, and only when a version is shown (review RECOMMENDED 1) | Naming consistency | RECOMMENDED | Reworded: the client shortens, the footer renders. Applied |
| 2 | e2e/tests/TEST-08_footer_app_version.spec.ts | Exact footer text only holds when BUILD_COMMIT is unset (review RECOMMENDED 2) | Excessive complexity (brittle assertion) | RECOMMENDED | Footer text matched with a pattern allowing the optional short commit; aborted-request case kept exact. Applied |

No findings in the other five files: no dead code, duplication, or naming drift.

Verification of finding 2: stack built with BUILD_COMMIT=0f0e7a668920851ba8199ffa6ae2252197be5956 (supplied through a compose --env-file under .mayker/staging because writing the root .env is denied), `/api/version` returned commit 0f0e7a668920, spec passed 2 of 2. Stack torn down. Frontend vitest: 50 passed.
