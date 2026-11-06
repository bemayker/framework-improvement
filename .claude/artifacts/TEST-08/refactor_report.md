# Refactor report: TEST-08

Outcome: 2 improvements applied (13 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Stale ports 5173 and 8000 contradict the real 5183 and 8010 (review RECOMMENDED 1) | Naming consistency | RECOMMENDED | Ports corrected in both artifacts. Applied |
| 2 | frontend/src/api/version.ts, frontend/src/api/version.test.ts | `const { version } = body` throws on a JSON null body; contract says null (review RECOMMENDED 2) | Excessive complexity | RECOMMENDED | Narrow body before reading; added a null case to the existing it.each. No file created. Applied |

Optional (not applied): notes.ts import placement, carried to the PR body.
