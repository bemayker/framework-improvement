# UAT Script: TEST-08 Footer shows the app version

See e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md for the full manual script (15 steps).

## Prerequisites

- Stack running with `docker compose up --build` (frontend http://localhost:5183, backend http://localhost:8010).
- Expected version is the one in `backend/pyproject.toml` (`0.1.0`).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/`, read the footer (criteria 1, 2, 5) | `Task Notes v0.1.0`, not `v0.0.0` | [ ] Pass [ ] Fail |
| 3 | `docker compose stop backend`, reload (criterion 3) | Footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 4 | `docker compose start backend`, reload | Footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 5 | `npm --prefix frontend test -- src/components/AppFooter.test.tsx` (criterion 4) | `0 failed`, present and absent cases | [ ] Pass [ ] Fail |
| 6 | DevTools 10000 ms latency, reload (criterion 6) | While pending the footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 7 | Block the `api/version` URL, reload (criterion 7) | Footer reads exactly `Task Notes`, not `unknown`, not blank | [ ] Pass [ ] Fail |
