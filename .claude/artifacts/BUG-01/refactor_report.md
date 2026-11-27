# Refactor report: BUG-01

Gate outcome: 1 improvements applied (8 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature | Background pinned every scenario, including criterion 3, to http://localhost:8000, so the deployed-CDN scenario could not observe the defect (review RECOMMENDED 1) | File and component structure | RECOMMENDED | Removed Background; localhost Given moved into scenarios 1 and 4; scenario 3 now has `Given the backend is reachable at "https://<deployed-host>"`, matching script step 6 |

## Discharge notes

- Review RECOMMENDED 1 applied, with one deviation: scenario 2 (criterion 2) runs pytest and makes no HTTP call, so it gets no localhost Given. The finding listed scenarios 1, 2 and 4.
- Review OPTIONAL finding: not acted on, goes to the PR body's known improvements.
- No file created.

## Tests after the change

- unit and integration (no database routes): 45 passed, 0 failed.
