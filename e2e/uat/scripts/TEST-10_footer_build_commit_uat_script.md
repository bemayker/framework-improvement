# UAT script: TEST-10 Footer shows the build commit

The landing page footer shows the first 7 characters of the build commit next to the version. The version and commit come from `GET /api/version`. `version` is whatever `[project].version` in `backend/pyproject.toml` says (`0.1.0` below).

## Prerequisites

- Docker is running.
- The repository is on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `.env` exists, copied from `.env.example`.
- From the repository root, run `BUILD_COMMIT=0123456789abcdef docker compose up --build -d`, then wait until `docker compose ps` shows `frontend`, `backend` and `db` running.
- The frontend is on http://localhost:5183 and the backend on http://localhost:8010 (from `docker-compose.yml`).
- A terminal with `npm`, and a browser.

## Criterion 1: the footer shows the first 7 characters of the commit next to the version

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Open `http://localhost:8010/api/version` | JSON with `"version": "0.1.0"` and `"commit": "0123456789ab"` (12 characters) | [ ] | [ ] |
| 1.2 | Open `http://localhost:5183/` | The landing page titled "Task Notes" loads | [ ] | [ ] |
| 1.3 | Read the footer under the note list | It reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 commit characters in parentheses, and not `0123456789ab` | [ ] | [ ] |

## Criterion 2: while pending or on failure, the footer shows the version alone

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The page loads and the footer reads exactly `Task Notes`, with no `undefined`, no `null`, no `()` and no error text | [ ] | [ ] |
| 2.2 | Run `docker compose start backend`, wait for `http://localhost:8010/api/version` to answer, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0 (0123456)` again | [ ] | [ ] |
| 2.3 | With `BUILD_COMMIT` unset in your shell, run `docker compose up --build -d`, wait for the stack to run, and open `http://localhost:8010/api/version` | `"commit"` is `"unknown"` | [ ] | [ ] |
| 2.4 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, the version alone, with no `()` and no `unknown` | [ ] | [ ] |
| 2.5 | The pending state is too brief to see by hand; it is verified by the component test in step 3.1 | Not a manual step, no result to record | [ ] | [ ] |

## Criterion 3: a component test covers the success, pending and failure paths

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `npm --prefix frontend ci`, then `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The success-with-commit, pending and failure tests are listed, and the summary reports `0 failed` | [ ] | [ ] |
| 3.2 | Run `npm --prefix frontend test` | The full frontend suite, including `src/api/version.test.ts` and `src/components/LandingPage.test.tsx`, reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Footer shows 7-character commit next to the version | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Version alone while pending or on failure | 2.1 to 2.5 | [ ] Pass  [ ] Fail |
| 3. Component test covers success, pending, failure | 3.1 to 3.2 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
