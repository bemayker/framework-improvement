DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits and strips CORS_ORIGINS entries but never removes a trailing "/", so "http://localhost:5183/" is kept verbatim.
Cause: backend/app/main.py:49-50 passes that list to CORSMiddleware allow_origins, which compares exact strings against the browser's slash-less Origin, so no Access-Control-Allow-Origin header is sent.
Fix direction: in _read_cors_origins, strip a trailing "/" from each entry (entry.strip().rstrip("/")) before the empty check, so blank/unset still falls back to DEFAULT_CORS_ORIGINS.
Fix direction: add a backend unit test that sets CORS_ORIGINS="http://localhost:5183/" and asserts the resolved origin is "http://localhost:5183" (fails before, passes after).
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — arm=PUBLISH_ARM
Reproduction: CORS_ORIGINS=http://localhost:5183/ backend on :8010, then curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin (no output; expected the header); or call _read_cors_origins() with that env value and see the trailing slash retained.

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:49-50
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
```
