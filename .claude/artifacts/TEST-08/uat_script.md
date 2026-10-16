# UAT Script: TEST-08 Footer shows the app version

Tester: ____________  Date: ____________  Build / commit: ____________

## Prerequisites

- The stack is running from the repo root: `docker compose up -d --build` (db, backend on port 8010, frontend on port 5183).
- `backend/pyproject.toml` has `version = "0.1.0"` at the time of writing. If it has since been bumped, read the current value there and use it in place of 0.1.0 below.
- `frontend/package.json` has `version` `0.0.0`. The footer must never show this value.
- Frontend dependencies installed for Criterion 4: `npm --prefix frontend install`.

## Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | In a terminal, run `curl -s http://localhost:8010/api/version` | JSON body has a `version` field reading `0.1.0` (a `commit` field may also be present once TEST-09 has merged) | [ ] | [ ] |
| 1.2 | Open `http://localhost:5183/` in a browser | Landing page shows the heading `Task Notes`, the note form, and the footer at the bottom | [ ] | [ ] |
| 1.3 | Read the footer text | It reads `Task Notes v0.1.0` | [ ] | [ ] |

## Criterion 2: The version comes from a single declared source, never typed into the component

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Open `frontend/package.json` and `backend/pyproject.toml` | Frontend `version` reads `0.0.0`, backend `version` reads `0.1.0` | [ ] | [ ] |
| 2.2 | Open `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` and does not contain `0.0.0`, so the value comes from the backend | [ ] | [ ] |
| 2.3 | Open browser developer tools, Network tab, filter on `version`, reload the page | One `GET http://localhost:8010/api/version` request with status 200 appears | [ ] | [ ] |
| 2.4 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal such as `0.1.0` and no import of `package.json`; it calls `fetchVersion` from `../api/version` | [ ] | [ ] |

## Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | At the repo root run `docker compose stop backend` | The backend container stops; `curl -s http://localhost:8010/api/version` fails to connect | [ ] | [ ] |
| 3.2 | Open (or hard-reload) `http://localhost:5183/` | The page still renders its heading and note form | [ ] | [ ] |
| 3.3 | Read the footer text | It reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or gap after the name | [ ] | [ ] |
| 3.4 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, reload the page | The footer reads `Task Notes v0.1.0` again | [ ] | [ ] |
| 3.5 | Optional, loading state: in developer tools set Network throttling to Slow 3G and reload | While the request is pending the footer reads `Task Notes` alone, and ` v0.1.0` appears once it completes | [ ] | [ ] |

## Criterion 4: A component test asserts both paths

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repo root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | Vitest runs both files and reports 0 failed | [ ] | [ ] |
| 4.2 | Open `frontend/src/components/AppFooter.test.tsx` | One test has the mocked `fetchVersion` resolve and the footer show the version; one has it reject and the footer read exactly `Task Notes` with no version element | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed | Notes |
|-----------|-------|--------|--------|-------|
| 1. Footer renders the version | 1.1 to 1.3 | | | |
| 2. Single declared source | 2.1 to 2.4 | | | |
| 3. Unresolvable version renders without it | 3.1 to 3.5 | | | |
| 4. Component test covers both paths | 4.1 to 4.2 | | | |

Overall result: [ ] PASS  [ ] FAIL

Sign-off: ____________
