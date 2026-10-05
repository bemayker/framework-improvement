# Shared Risk Analysis, CHORE-02

## Files this feature will create
- e2e/uat/scenarios/CHORE-02_test_08_follow_up.feature
- e2e/uat/scripts/CHORE-02_test_08_follow_up_uat_script.md
- .claude/artifacts/CHORE-02/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: adds `VERSION_REQUEST_TIMEOUT_MS` and a `signal: AbortSignal.timeout(...)` argument on the fetch
- frontend/src/api/version.test.ts: updates the URL assertion (fetch now gets a second argument) and adds the timeout cases
- e2e/uat/scenarios/TEST-01_static_landing_page.feature: port text only (5173 to 5183)
- e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md: port text only (5173 to 5183, 8000 to 8010)
- e2e/uat/scenarios/TEST-03_simple_note_form.feature: port text only (5173 to 5183)
- e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md: port text only (5173 to 5183, 8000 to 8010, host 5432 to 5442)

## Potential conflicts with other independent features
- frontend/src/api/version.ts may also be modified by TEST-10 (planned concurrently in this run; reads the `commit` field, likely changing `getBackendVersion`'s return shape around the same `fetch` line). Builds serialize. Whichever builds second rebases and must keep both changes: the `signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS)` argument on the one fetch, and TEST-10's commit parsing.
- frontend/src/api/version.test.ts may also be modified by TEST-10 (its existing "returns the version and ignores other fields such as commit" case will change, and its URL assertion is the one this item edits). Same serialization; the second build reconciles the `toHaveBeenCalledWith` assertion so it carries the `signal` argument.
- frontend/src/components/AppFooter.tsx: NOT modified by CHORE-02 (the existing `.catch` already maps a timeout rejection to "version unavailable"), so the feature_map's "possibly AppFooter.tsx" overlap with TEST-10 does not materialize from this side. TEST-10's edits there must keep the rejection-to-"unavailable" mapping, which criterion 1 depends on.
- BUG-03 (depends on TEST-10, wave 5) will plausibly edit frontend/src/api/version.ts again; not concurrent with CHORE-02 under the dependency graph, noted for awareness only.
- The four TEST-01 / TEST-03 UAT files: no other open item in feature_map.md touches them.
