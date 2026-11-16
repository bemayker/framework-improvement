DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash stop matching the browser's Origin header?
Verdict: confirmed
Cause: backend/app/core/config.py:21 `_read_cors_origins` only strips whitespace, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:49 passes that entry unchanged to `CORSMiddleware(allow_origins=...)`, which compares it exactly to the slash-less `Origin` header.
Fix direction: In `_read_cors_origins`, `rstrip("/")` each entry after `strip()` and before the empty-entry filter, so unset and blank still fall back to the default.
Fix direction: Add a test with `CORS_ORIGINS=http://localhost:5183/` that asserts `access-control-allow-origin: http://localhost:5183`; it fails before the change and passes after.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: a lone `/` entry becomes empty after stripping and is dropped, which is fine; none other.
Written: docs/diagnose/BUG-02.md
Reproduction: `CORS_ORIGINS=http://localhost:5183/` on the backend, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing (needs the backend running on :8010).

## Evidence

```python
# backend/app/core/config.py
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    ...
)
```
