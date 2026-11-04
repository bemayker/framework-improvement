DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin header?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits CORS_ORIGINS on commas and strips only whitespace, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:51 passes it to CORSMiddleware, which compares exact strings with the slashless browser Origin, so no Access-Control-Allow-Origin header is sent.
Fix direction: In `_read_cors_origins` (config.py:19-22) strip trailing `/` from each entry (`entry.strip().rstrip("/")`) before the empty check, so a lone `/` is dropped like a blank one.
Fix direction: Add a unit test on `_read_cors_origins` / `get_settings()` that fails before and passes after; keep unset and blank behaviour (default origin) unchanged.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: Start the backend with `CORS_ORIGINS=http://localhost:5183/`, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing (expected `access-control-allow-origin: http://localhost:5183`).

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:49-54
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    ...
```
