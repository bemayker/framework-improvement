DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash not match the browser's origin?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits and strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:50 passes it as-is to CORSMiddleware `allow_origins`, which compares exact strings to the slashless Origin header.
Fix direction: In `_read_cors_origins` (config.py:19-22) also `rstrip("/")` each entry; blank/unset still falls back to the default.
Fix direction: Add a unit test in backend/tests/unit/test_config_unit.py that fails before and passes after.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: CORS_ORIGINS=http://localhost:5183/ backend on :8010, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing.

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:49-50
CORSMiddleware,
allow_origins=list(settings.cors_origins),
```
