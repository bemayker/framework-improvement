DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin?
Verdict: confirmed
Cause: backend/app/core/config.py:19-22 splits and strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:59 passes it as-is to CORSMiddleware, which compares exact strings with the slashless Origin.
Fix direction: in `_read_cors_origins`, also `rstrip("/")` each entry before the empty check; unset/blank still falls to the default.
Fix direction: add a unit test in backend/tests/unit/test_config_unit.py (slash entry yields the slashless origin; fails before, passes after).
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: an entry of only "/" becomes empty after rstrip and is dropped, falling to the default
Written: docs/diagnose/BUG-02.md
Reproduction: CORS_ORIGINS=http://localhost:5183/ uvicorn app.main:app --port 8010, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing.

## Evidence

```python
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:58-59
CORSMiddleware, allow_origins=list(settings.cors_origins),
```
