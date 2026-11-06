DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash not match the browser's Origin?
Verdict: confirmed
Cause: backend/app/core/config.py:19-22 splits and strips CORS_ORIGINS but keeps a trailing "/" on each entry.
Cause: backend/app/main.py:50 passes those entries to CORSMiddleware, which matches Origin by exact string, so "http://localhost:5183/" never equals "http://localhost:5183".
Fix direction: In _read_cors_origins, strip a trailing "/" from each entry (entry.strip().rstrip("/")) before the empty-entry filter.
Fix direction: Add a unit test: CORS_ORIGINS=http://localhost:5183/ yields ("http://localhost:5183",); unset and blank still yield the default.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: CORS_ORIGINS=http://localhost:5183/ backend on :8010, then curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin (no header returned); not run here, confirmed by reading the code.

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```
