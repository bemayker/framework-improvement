# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- `.env` copied from `.env.example` in the repository root.
- Ports `5183` (frontend) and `8010` (backend) free.
- `backend/pyproject.toml` reads `version = "0.1.0"` and `frontend/package.json` reads `"version": "0.0.0"`. If either is bumped later, substitute the current values below.

## Test Environment Setup

1. From the repository root, run `docker compose up --build`.
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Navigate to `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and the note list | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom of the page | The footer reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 4 | 2 | Compare `frontend/package.json` (`0.0.0`) with `backend/pyproject.toml` (`0.1.0`) | The two versions differ | [ ] Pass [ ] Fail |
| 5 | 2 | On `http://localhost:5183/`, open devtools Network and reload | A `GET` to `http://localhost:8010/api/version` appears with status 200 and body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | 2 | Read the footer | It reads `Task Notes v0.1.0` and does not contain `0.0.0` | [ ] Pass [ ] Fail |
| 7 | 2 | Open `frontend/src/components/AppFooter.tsx` | It has no `package.json` import and no version literal such as `"0.1.0"` | [ ] Pass [ ] Fail |
| 8 | 3 | Run `docker compose stop backend`, then navigate to `http://localhost:5183/` | The landing page renders; the Network tab shows the `/api/version` request failing | [ ] Pass [ ] Fail |
| 9 | 3 | Read the footer | It reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or trailing gap | [ ] Pass [ ] Fail |
| 10 | 3 | Run `docker compose start backend` and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 11 | 4 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | 0 failed; the AppFooter test names include a version-present case and a version-absent case | [ ] Pass [ ] Fail |
| 12 | 5 | Open the plan's `## Re-Plan Feedback` section (`.claude/artifacts/TEST-08/plan.md`) | It records the loading state (`Task Notes` only) and the failure state (`Task Notes` only, blank rather than `unknown`) with reasons | [ ] Pass [ ] Fail |
| 13 | 5 | On `http://localhost:5183/`, set devtools Network throttling to "Slow 3G" and reload | While `/api/version` is pending the footer reads exactly `Task Notes`, then changes to `Task Notes v0.1.0` with no intermediate placeholder | [ ] Pass [ ] Fail |
| 14 | 5 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | 0 failed, including the loading-state and failure-state cases | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
