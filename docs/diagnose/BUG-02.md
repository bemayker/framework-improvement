DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend, and what is the minimal fix?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 `_read_cors_origins` only strips whitespace, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:52 hands that list to CORSMiddleware, which compares it exactly to the browser's `Origin` (no trailing slash), so no `Access-Control-Allow-Origin` is sent.
Fix direction: in `_read_cors_origins`, `rstrip("/")` each entry after `strip()`, before the empty-entry filter.
Fix direction: add one unit test (trailing-slash entry resolves to the slashless origin; fails before, passes after) and keep the unset/blank tests as they are.
Size: S — label mayker:ready-for-fix
Questions: none
Noticed, not pursued: an entry that is only `/` becomes empty after rstrip, so it should fall through the empty filter to the default (verify in the fix).
Written: docs/diagnose/BUG-02.md
Reproduction: CORS_ORIGINS=http://localhost:5183/ backend on :8010, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` (prints nothing); or in Python: `CORS_ORIGINS=http://localhost:5183/` then `get_settings().cors_origins` is `('http://localhost:5183/',)`.

## Evidence

`backend/app/core/config.py:19-22`

```python
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

`backend/app/main.py:51-52` passes `allow_origins=list(settings.cors_origins)` to `CORSMiddleware`.
