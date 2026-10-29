# Implementation Plan, FEAT-11: VERIFY MDF-505: backend GET /api/ping/count returns a counter

## Feature
> Loop: staged for verify of MDF-505 (row 248), wave 2. Depends on the item 'VERIFY MDF-505: backend GET /api/ping returns ok' (needs its route). Backend only: add GET /api/ping/count in backend/app/ping.py returning {"count": N}, N the number of pings answered since start, with a pytest test. Acceptance: two pings then count gives 2.

## Acceptance Criteria
- [ ] 1. `GET /api/ping/count` answers HTTP 200 with the JSON body `{"count": N}`, where N is the number of `GET /api/ping` requests answered since the application started.
- [ ] 2. The route is added in `backend/app/ping.py` (the FEAT-10 module).
- [ ] 3. Two pings followed by a count request gives `{"count": 2}`.
- [ ] 4. A pytest test asserts criterion 3.

## Re-Plan Feedback
- Tracker comments read: 0 (none on the item). Merged since: n/a (fresh plan, branched from current main at bd311ad, which already contains FEAT-10's `backend/app/ping.py` from #371).
- Layering question raised by FEAT-10's plan verdict (the counter introduces state into ping.py), answered: the counter is business state with a concurrency rule, so it moves behind a service, per Router, Service, Repository in `coding_standards/backend_frontend.md` Section 2.2 ("Router: NO business logic here"). A new `backend/app/services/ping_service.py` holds a `PingCounter` class (a lock-guarded integer with `increment()` and `value()`). `backend/app/ping.py` keeps only routing and response schemas, as the ticket's file name requires. No repository layer: nothing is persisted (see next assumption). FEAT-10's "no service layer" decision is not reversed for `GET /api/ping` itself; it still returns a constant, it now also calls `counter.increment()`.
- Assumption (autonomous run, no human to ask): "since start" means since the running application instance started, so the count is in-memory and resets on restart. No database table: persisting it would outlive "start" and contradict the ticket, and Architecture Notes say keep every feature as small as possible.
- Assumption: the counter lives on the app instance (`app.state.ping_counter`, set in `create_app()`), not in a module-level global. Reason: the test suite shares one session-scoped `client` and calls `create_app()` repeatedly; a module global would carry pings from other tests into "two pings then count gives 2" and make that test order-dependent (`testing_standards.md` Section 5: no shared mutable state, no reliance on order). Each `create_app()` therefore starts at 0, matching the existing `test_create_app_returns_independent_instances` intent. Cost: one line in `backend/app/main.py`.
- Assumption: only answered `GET /api/ping` requests count. `GET /api/ping/count` itself does not increment, and a rejected `POST /api/ping` (405) does not either, since it is not a ping answered.
- Assumption: the count is per process. The backend runs one uvicorn process (`backend/Dockerfile` CMD, no `--workers`), so per process equals per application. Recorded as a shared risk for any future multi-worker change, not handled here (no gold plating).

## Plan Overview
Backend only. A new service module `backend/app/services/ping_service.py` defines `PingCounter`, a thread-safe in-memory counter (`threading.Lock`, because FastAPI runs sync handlers in a thread pool, so two pings can increment at the same time). `create_app()` attaches one fresh `PingCounter` to `app.state.ping_counter`. In `backend/app/ping.py`, a dependency `get_ping_counter(request)` returns that instance; `GET /api/ping` increments it before answering, and the new `GET /api/ping/count` returns `PingCountResponse(count=counter.value())`. No database, no configuration, no frontend.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/ping/count`, returns `{"count": N}` with 200, N the number of `GET /api/ping` requests answered by this application instance. `GET /api/ping` (FEAT-10) is unchanged in contract and now increments the counter. Neither needs a database, so both answer with `DATABASE_URL` unset.
- Service layer: new `backend/app/services/ping_service.py`, module docstring naming FEAT-11. `class PingCounter` with `__init__` setting `self._count = 0` and `self._lock = threading.Lock()`; `increment(self) -> int` adds 1 under the lock and returns the new value; `value(self) -> int` returns the current value under the lock. No module-level instance.
- Router (`backend/app/ping.py`): add `class PingCountResponse(BaseModel)` with `count: int` beside `PingResponse`; add `def get_ping_counter(request: Request) -> PingCounter` returning `request.app.state.ping_counter`; change `get_ping` to take `counter: PingCounter = Depends(get_ping_counter)` and call `counter.increment()` before returning `PingResponse(status=STATUS_OK)`; add `@router.get("/ping/count", response_model=PingCountResponse)` handler `get_ping_count(counter: PingCounter = Depends(get_ping_counter)) -> PingCountResponse` returning `PingCountResponse(count=counter.value())`. Update the module docstring: it no longer holds "no business logic to put in a service"; it now says the counter state lives in `app.services.ping_service`.
- App factory (`backend/app/main.py`): import `PingCounter` and set `app.state.ping_counter = PingCounter()` in `create_app()` before `include_router`; add FEAT-11 to the module docstring. Nothing else changes (CORS, lifespan, router order untouched).
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/ping/count`
- Request: no body, no query parameters
- Response: 200, `application/json`, body `{"count": 2}` after two answered `GET /api/ping` requests; `{"count": 0}` on a freshly started app
- Other methods: `POST /api/ping/count` answers 405 (FastAPI default, asserted as the router's error case)
- Unchanged: `GET /api/ping` still answers 200 with `{"status": "ok"}`; its side effect is incrementing the counter.

## Technology Selection
- `PingCounter` (net-new service): chose the standard library's `threading.Lock` around a plain `int` over `itertools.count` (stdlib, but it cannot be read without advancing it) and over a database row or a new dependency (none needed for an in-memory, since-start count).
- Counter ownership: chose FastAPI's built-in `app.state` plus `Depends` (already installed) over a module-level global, because a global is shared across `create_app()` instances and tests.
- `PingCountResponse` model: chose Pydantic `BaseModel` (already installed via FastAPI, as `PingResponse` does) over a raw `dict` return.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/services/ping_service.py: `PingCounter`, the lock-guarded in-memory ping counter
- [B] backend/tests/unit/test_ping_service_unit.py: `PingCounter` unit tests: starts at 0; two increments give 2; `value()` does not advance; separate instances are independent; concurrent increments from several threads give the exact total
- [G] e2e/uat/scenarios/FEAT-11_api_ping_count.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/FEAT-11_api_ping_count_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/FEAT-11/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/ping.py: `PingCountResponse`, `get_ping_counter` dependency, `GET /api/ping/count` handler, `GET /api/ping` increments the counter; docstring updated
- [B] backend/app/main.py: `app.state.ping_counter = PingCounter()` in `create_app()`; docstring names FEAT-11
- [B] backend/tests/integration/test_ping_integration.py: count tests on a fresh `create_app()` per test (two pings then count gives 2; count is 0 before any ping; count requests do not increment; `POST /api/ping/count` returns 405)
- [B] backend/tests/unit/test_main_unit.py: `/api/ping/count` is among the app's custom routes; two `create_app()` calls get distinct `ping_counter` instances
No dependency changes, so no lockfile entry. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no project structure, run configuration, dependency or test infrastructure change.

## Testing Strategy
- Unit tests: `PingCounter` in isolation (tier question 1 is yes: service-layer logic). Happy path (two increments give 2), edge cases (starts at 0; `value()` is read-only; two instances independent), and the concurrency case (8 threads times 100 increments give exactly 800). There is no error path in the counter itself; the error case for this feature is the router's 405, covered at integration. App-factory wiring: route registration and one counter per app, in the existing `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_ping_service_unit.py, and existing test_main_unit.py)
- Integration tests: through the full HTTP cycle on a fresh `create_app()` inside `with TestClient(app)` per test, never the session `client` fixture, because that fixture's counter is shared by every test that pings. Cases: two `GET /api/ping` then `GET /api/ping/count` gives 200 and exactly `{"count": 2}`; `GET /api/ping/count` on a fresh app gives `{"count": 0}`; two `GET /api/ping/count` calls in a row both give `{"count": 0}`; `POST /api/ping/count` gives 405. The existing FEAT-10 tests stay as they are. No database fixture used.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI (backend-only feature, no frontend change); every criterion is covered at integration or unit level below.
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (count before any ping is 0), validated for well-formedness.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/ping/count` answers 200 with `{"count": N}`, N the pings answered since start | Integration | verifying it needs no navigation or interaction: it is a router response, checked through the real HTTP cycle (counter semantics also unit-tested) |
| 2 | Route added in `backend/app/ping.py` | Unit | verifying it needs no navigation or interaction: it is app wiring, checked by the route-registration test in test_main_unit.py |
| 3 | Two pings then count gives 2 | Integration | verifying it needs no navigation or interaction: three HTTP calls against a fresh app, asserted on the JSON body |
| 4 | A pytest test asserts criterion 3 | Integration | verifying it needs no navigation or interaction: satisfied by the two-pings test in test_ping_integration.py existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/ping/count` answers 200 with `{"count": N}` | covered at Integration, see Criterion coverage | Given a freshly started backend, When a client sends GET /api/ping/count, Then the status is 200 and the body is {"count": 0} |
| 2 | Route added in `backend/app/ping.py` | covered at Unit, see Criterion coverage | Given the app is created by create_app, When its routes are listed, Then /api/ping/count is among them |
| 3 | Two pings then count gives 2 | covered at Integration, see Criterion coverage | Given a freshly started backend, When a client sends GET /api/ping twice and then GET /api/ping/count, Then the body is {"count": 2} |
| 4 | A pytest test asserts criterion 3 | covered at Integration, see Criterion coverage | Given the backend test suite, When the ping tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: `GET /api/ping/count` answers 200 with `{"count": N}`
Not verifiable through the UI: the feature adds no frontend. The observable check is the HTTP response.
Prerequisites: FEAT-11 branch checked out; stack started from the repo root with `docker compose up -d --build`, backend on `http://localhost:8010`; no ping sent since the backend started (run `docker compose restart backend` to reset the count).
1. In a terminal, run `curl -i http://localhost:8010/api/ping/count` → status line `HTTP/1.1 200 OK`, body exactly `{"count":0}`.
2. Run `curl http://localhost:8010/api/ping/count` again → body is still `{"count":0}` (a count request is not a ping).
3. Run `curl http://localhost:8010/api/ping` once, then `curl http://localhost:8010/api/ping/count` → body `{"count":1}`.
4. Edge case: run `curl -i -X POST http://localhost:8010/api/ping/count` → status `405 Method Not Allowed`.

### Criterion 2: route added in `backend/app/ping.py`
Not verifiable through the UI. The observable check is the code and the OpenAPI listing.
Prerequisites: FEAT-11 branch checked out; backend running as in Criterion 1.
1. Open `backend/app/ping.py` → it defines `GET /ping/count` on the `/api` router, returning `PingCountResponse`.
2. Open `backend/app/services/ping_service.py` → it defines `PingCounter`; `ping.py` holds no counter variable of its own.
3. Open `http://localhost:8010/docs` → the `ping` section lists both `GET /api/ping` and `GET /api/ping/count`.

### Criterion 3: two pings then count gives 2
Prerequisites: backend running as in Criterion 1, freshly restarted with `docker compose restart backend`.
1. Run `curl http://localhost:8010/api/ping` → body `{"status":"ok"}`.
2. Run `curl http://localhost:8010/api/ping` again → body `{"status":"ok"}`.
3. Run `curl http://localhost:8010/api/ping/count` → body exactly `{"count":2}`.
4. Run `docker compose restart backend`, wait until `curl http://localhost:8010/api/ping/count` answers → body `{"count":0}` (the count is since start).

### Criterion 4: a pytest test asserts criterion 3
Prerequisites: FEAT-11 branch checked out; uv installed; no database needed.
1. From the repo root, run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py tests/unit/test_ping_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`, and the test that sends two pings and asserts `{"count": 2}` is among the tests run.
