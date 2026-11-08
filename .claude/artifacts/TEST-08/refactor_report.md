# Refactor report: TEST-08

Files examined: 9 (AppFooter.tsx, version.ts, baseUrl.ts, notes.ts, the TEST-08 and TEST-04 UAT scripts, the TEST-04 scenario and spec, the TEST-08 UAT script copy)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md, .claude/artifacts/TEST-08/uat_script.md | Summary says 17 steps, script has 14 (review RECOMMENDED 1) | Naming consistency | RECOMMENDED | Set total to 14 in both. Applied |
| 2 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Ports 5173 and 8000 contradict docker-compose.yml (5183, 8010) (review RECOMMENDED 2) | Naming consistency | RECOMMENDED | Use 5183 and 8010. Applied |
| 3 | e2e/tests/TEST-04_page_footer.spec.ts | Version falls back to "" so toContainText passes vacuously (review RECOMMENDED 3) | Dead code | RECOMMENDED | Throw when no version match, drop the fallback. Applied |

Source files (AppFooter.tsx, version.ts, baseUrl.ts, notes.ts): no findings.
