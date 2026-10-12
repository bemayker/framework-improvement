# Shared Risk Analysis, TEST-07

## Files this feature will create
- backend/app/routers/uptime.py
- backend/app/schemas/uptime.py
- backend/app/services/uptime_service.py
- backend/tests/unit/test_uptime_service_unit.py
- backend/tests/unit/test_uptime_schema_unit.py
- backend/tests/integration/test_uptime_integration.py
- e2e/uat/scenarios/TEST-07_uptime_endpoint.feature
- e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md

## Existing files this feature will modify
- backend/app/main.py: new router import and `include_router` line in `create_app()`, one startup line in `lifespan` (`app.state.process_start`), docstring lists
- backend/tests/unit/test_main_unit.py: one added route-registration test

## Potential conflicts with other independent features
<!--
  Derived from the feature text and .claude/feature_map.md (TEST-07's row and
  every row that shares backend/app/main.py). The map's closing note predates
  the 0.3.309 sandbox reset: it calls TEST-07 and FEAT-1 done, but main
  (7fb9e25) holds no uptime or server_time router, so status is taken from main
  and the tracker, not from that note.
-->
- backend/app/main.py may also be modified by FEAT-1 (Server time endpoint, depends only on TEST-01, independent, could run concurrently): it registers a router in `create_app()`; the map flags FEAT-1, TEST-06 and TEST-07 together. Serialize.
- backend/app/main.py may also be modified by TEST-09 (Version endpoint reports the build commit, depends only on TEST-01, independent, could run concurrently): the map records it registers a router in `main.py`. Serialize.
- backend/app/main.py and backend/tests/unit/test_main_unit.py may also be modified by TEST-13 (Ping endpoint, depends only on TEST-01, independent, could run concurrently): a new endpoint registers its router in `create_app()` and, by the established convention, adds a registration test to `test_main_unit.py`. Its map row carries no shared-risk note yet, so this pair is newly inferred here; serialize.
- backend/app/main.py `lifespan` may also be modified by any concurrently built item that changes startup (none in the map today; TEST-03 owns the existing schema-initialisation branch and is merged). Noted because TEST-07 is the first item since TEST-03 to edit `lifespan`.
- TEST-06 (Echo endpoint) shares the same `main.py` registration lines per the map, but it is merged on main (7fb9e25, the commit this branch was cut from), so it can no longer run concurrently: no conflict.
- TEST-08 (frontend only) is disjoint from this item, as the feature text states: no conflict.
