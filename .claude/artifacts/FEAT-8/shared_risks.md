# Shared Risk Analysis, FEAT-8

## Files this feature will create
- e2e/uat/scenarios/FEAT-8_api_version_json_version.feature
- e2e/uat/scripts/FEAT-8_api_version_json_version_uat_script.md
- .claude/artifacts/FEAT-8/uat_script.md

## Existing files this feature will modify
- backend/pyproject.toml: `[project].version` 0.1.0 to 1.0, which changes what GET /api/version and the app footer report
- backend/uv.lock: root package version entry regenerated
- backend/tests/integration/test_version_integration.py: one added test

## Potential conflicts with other independent features
- backend/pyproject.toml and backend/uv.lock may also be modified by any item that adds or changes a backend dependency; no such item is open in feature_map.md at plan time (FEAT-8 is the only scheduled node this run).
- backend/tests/integration/test_version_integration.py is owned by TEST-05 and TEST-09 (both complete); no open item targets it.
- backend/app/main.py is NOT modified (the version router is already registered), so the router-registration conflict the feature_map.md row 190 note names does not apply to this plan.
- Behavioural coupling, not a file conflict: TEST-04, TEST-08 and TEST-10 (complete) display or assert the backend version. Their E2E specs read the value from backend/pyproject.toml and stay correct; their committed Gherkin scenarios and manual UAT scripts quote 0.1.0 as example text and become stale examples. Not edited by this item (scope containment); listed in the PR description.
