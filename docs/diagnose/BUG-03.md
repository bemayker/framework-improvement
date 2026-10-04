DIAGNOSE BUG-03: Does the footer ever show the word `unknown` where the build commit belongs, and is that a defect or an unset commit?
Verdict: not a bug
Cause: The footer cannot render the word `unknown`: `frontend/src/api/version.ts:16,23` maps the backend's `unknown` commit sentinel to `null`, and `frontend/src/components/AppFooter.tsx:45` omits the commit when it is `null`.
Cause: On a stack started without `BUILD_COMMIT`, `backend/app/core/config.py:20,25` answers `unknown` by design (`.env.example:24`), so the footer shows `Task Notes v{version}` with no commit; with it set, a 7-character commit shows (`AppFooter.tsx:49`).
Fix direction: None for the code. The commit is simply not set in that environment; pass it with `BUILD_COMMIT=<sha> docker compose build backend` (README.md:20).
Size: none — label none (item carries no readiness label)
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-03.md
Reproduction: `docker compose build backend && docker compose up -d` with `BUILD_COMMIT` unset, open the landing page: footer reads `Task Notes v{version}`, no commit. `npm --prefix frontend test` covers it (`version.test.ts` "the unknown commit sentinel", `AppFooter.test.tsx` "renders the version alone when the commit is absent").

## Evidence

```ts
// frontend/src/api/version.ts:16-24
const UNRESOLVED_BACKEND_COMMIT = "unknown";
function normaliseCommit(commit: unknown): string | null {
  if (typeof commit !== "string" || commit === "") {
    return null;
  }
  return commit === UNRESOLVED_BACKEND_COMMIT ? null : commit;
}
```

```tsx
// frontend/src/components/AppFooter.tsx:45-47
{info.commit !== null && (
  <>
    {" ("}
```

```py
# backend/app/core/config.py:20,25
DEFAULT_BUILD_COMMIT = "unknown"
return (os.environ.get("BUILD_COMMIT") or "").strip() or DEFAULT_BUILD_COMMIT
```
