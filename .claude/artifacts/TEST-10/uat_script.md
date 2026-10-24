# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `.env` copied from `.env.example` in the repository root; `BUILD_COMMIT` not set in it.
- Ports `5183` (frontend) and `8010` (backend) free.
- Node installed and `npm --prefix frontend install` run once (for steps 10 and 11).

## Test Environment Setup

1. From the repository root, run `BUILD_COMMIT=9a6bfd7c3e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b docker compose up -d --build`.
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Run `curl -s http://localhost:8010/api/version` | The body is `{"version":"0.1.0","commit":"9a6bfd7c3e1f"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` and scroll to the bottom | The footer reads exactly `Task Notes v0.1.0 (9a6bfd7)` | [ ] Pass [ ] Fail |
| 3 | 1 | Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset in the shell, then reload | The footer reads exactly `Task Notes v0.1.0`, with no `unknown` and no empty parentheses | [ ] Pass [ ] Fail |
| 4 | 2 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The page renders and the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text | [ ] Pass [ ] Fail |
| 5 | 2 | Run `docker compose start backend`, set devtools Network throttling to `Slow 3G`, and reload | While the `version` request is pending the footer reads `Task Notes`; once it completes it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Set throttling back to `No throttling` | Throttling is off | [ ] Pass [ ] Fail |
| 7 | 3 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 8 | 3 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a success test (first 7 characters of the commit in parentheses), a pending test (footer reads `Task Notes`) and a failure test (footer reads `Task Notes`, no `undefined`, `null` or `unknown`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
