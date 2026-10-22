DIAGNOSE BUG-02: does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin, so no Access-Control-Allow-Origin header is sent?
Verdict: confirmed
Cause: backend/app/core/config.py:25-28 `_read_cors_origins` strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:57 passes it to `CORSMiddleware(allow_origins=...)`, which compares exactly against `Origin: http://localhost:5183` (never a trailing slash).
Fix direction: In `_read_cors_origins`, `rstrip("/")` each entry and drop entries left empty; the unset/blank fallback to DEFAULT_CORS_ORIGINS stays as is.
Fix direction: Add a unit test in backend/tests/unit/test_config_unit.py (fails before, passes after) and, optionally, one integration check on the header.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: `CORS_ORIGINS=http://localhost:5183/` on the backend, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` (prints nothing; needs the backend running on :8010)

## Evidence

```python
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:56-57
CORSMiddleware,
allow_origins=list(settings.cors_origins),
```
