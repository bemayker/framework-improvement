DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend?
Verdict: confirmed
Cause: backend/app/core/config.py:24-25 splits and strips entries but keeps a trailing "/", so "http://localhost:5183/" is passed unchanged to the middleware.
Cause: backend/app/main.py:51 hands that list to CORSMiddleware, which compares it exactly to the browser's slash-free Origin, so no Access-Control-Allow-Origin header is sent.
Fix direction: In `_read_cors_origins`, strip a trailing "/" from each entry (`entry.strip().rstrip("/")`) before the blank filter.
Fix direction: Add a unit test with CORS_ORIGINS="http://localhost:5183/" asserting the slash-free origin; unset and blank paths stay untouched.
Size: S — label mayker:ready-for-fix not set: already on the item, kept as is
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: CORS_ORIGINS=http://localhost:5183/ with the backend on :8010, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing.

## Evidence

```python
# backend/app/core/config.py:22-25
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

`backend/app/main.py:51`: `allow_origins=list(settings.cors_origins)`.

Static reading only; the curl reproduction was not run in this session.
