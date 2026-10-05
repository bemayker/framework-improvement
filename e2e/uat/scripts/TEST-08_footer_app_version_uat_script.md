# UAT Script: TEST-08 Footer shows the app version

The footer's version is read at runtime from the backend's `GET /api/version`. Run commands from the repository root. Mark each step Pass or Fail.

## Prerequisites

- Docker running; stack started with `docker compose up -d --build` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`, database on port `5442`).
- A browser with DevTools; `curl` optional.
- A terminal at the repository root; `npm` installed for Criterion 4.

## Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8010/api/version` in a browser tab and note the `version` value | A JSON body with a `version` value, e.g. `0.1.0` (plus a `commit` value once TEST-09 is merged) | [ ] | [ ] |
| 1.2 | Open `http://localhost:5183/` | The landing page with the "Task Notes" heading, the note form and the note list | [ ] | [ ] |
| 1.3 | Scroll to the bottom and read the footer | It reads `Task Notes v` followed by exactly the version noted in 1.1, e.g. `Task Notes v0.1.0`, and shows nothing of the `commit` value | [ ] | [ ] |

## Criterion 2: The version comes from a single declared source, never a string typed into the component

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `grep -n '"version"' frontend/package.json backend/pyproject.toml` | `frontend/package.json` and `backend/pyproject.toml` show different values (at plan time `0.0.0` and `0.1.0`) | [ ] | [ ] |
| 2.2 | Open `http://localhost:5183/` and read the footer | It shows the backend's value (e.g. `v0.1.0`), not the frontend's (`v0.0.0`) | [ ] | [ ] |
| 2.3 | Run `grep -n "package.json\|0\.1\.0" frontend/src/components/AppFooter.tsx` | No output: the component neither imports the package metadata nor contains a typed version | [ ] | [ ] |
| 2.4 | In DevTools, open Network and reload `http://localhost:5183/` | One request to `/api/version` with status 200; its response `version` is the value in the footer | [ ] | [ ] |

## Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `docker compose stop backend` | The backend container stops; `http://localhost:8010/api/version` no longer answers | [ ] | [ ] |
| 3.2 | Open (or reload) `http://localhost:5183/` and read the footer | It reads exactly `Task Notes · version unavailable`, with no `undefined`, no `null`, no `unknown` and no lone `v` | [ ] | [ ] |
| 3.3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] | [ ] |
| 3.4 | In DevTools Network set throttling to "Slow 3G" and reload `http://localhost:5183/` | The footer first reads `Task Notes` alone (no version, no separator), then changes to `Task Notes v0.1.0` when the request completes | [ ] | [ ] |
| 3.5 | Reset throttling to "No throttling" | Throttling is off | [ ] | [ ] |

## Criterion 4: A component test asserts both paths

This criterion is a test, not UI behaviour; the observable check is the test run.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `npm --prefix frontend test -- AppFooter` | The run passes and lists a test for the resolved-version path (`Task Notes v9.8.7`) and tests for the absent-version paths (`null` result and rejected request, each showing `Task Notes · version unavailable`) | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed | Result |
|---|---|---|---|---|
| 1. Footer renders the version | 1.1 - 1.3 | | | |
| 2. Single declared source (backend) | 2.1 - 2.4 | | | |
| 3. Unresolvable version | 3.1 - 3.5 | | | |
| 4. Component test, both paths | 4.1 | | | |

Tester: ______________  Date: ______________  Overall result: [ ] Pass  [ ] Fail

Notes: steps are carried through from the plan's Manual verification plan. Corrections: the prerequisites name the compose ports (5183, 8010, 5442); the plan's step 3.5 (reset throttling) is split out of 3.4 so it can be ticked; the plan's step 1.1 now notes the `commit` field is optional.
