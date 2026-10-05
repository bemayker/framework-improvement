DIAGNOSE BUG-03: Does the footer ever show the word `unknown` where the build commit should be, and is that a defect?
Verdict: not a bug
Cause: The footer never renders `unknown`: frontend/src/api/version.ts:16-21 turns the `unknown` sentinel into null, and frontend/src/components/AppFooter.tsx:52 renders the commit span only when it is non-null.
Cause: `unknown` exists only in the API: backend/app/core/config.py:21,32 defaults BUILD_COMMIT to it when unset or blank (docker-compose.yml passes `${BUILD_COMMIT:-}`, so a local stack has none).
Fix direction: none. A local stack without BUILD_COMMIT shows "Task Notes v{version}" with no commit, by design (TEST-09/TEST-10); set BUILD_COMMIT at build time to see the 7-character commit.
Size: none — label none
Questions: none
Noticed, not pursued: If the version itself is `unknown`, the footer shows "version unavailable" (AppFooter.tsx:9,63), not the word `unknown`.
Written: docs/diagnose/BUG-03.md — see publish line
Reproduction: `docker compose up --build` without BUILD_COMMIT set, open http://localhost:5183: footer has no commit; `curl localhost:8010/api/version` returns `"commit": "unknown"`. With `BUILD_COMMIT=abc1234def docker compose up --build` the footer shows `abc1234`.

## Evidence
```ts
// frontend/src/api/version.ts
const UNKNOWN_SENTINEL = "unknown";
return text === "" || text === UNKNOWN_SENTINEL ? null : text;
// frontend/src/components/AppFooter.tsx
{status.commit !== null && ( ... <span data-testid="app-footer-commit"> ...
```
Covered by frontend/src/api/version.test.ts:105 (commit "unknown" → null) and AppFooter.test.tsx:67.
