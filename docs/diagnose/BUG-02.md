DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's origin?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits and strips CORS_ORIGINS but keeps a trailing "/", so "http://localhost:5183/" is passed as-is.
Cause: backend/app/main.py:50 hands it to CORSMiddleware allow_origins, which compares exactly with the slash-less Origin header: no ACAO header, no warning.
Fix direction: in _read_cors_origins, strip a trailing "/" from each entry (entry.strip().rstrip("/")) before the empty check.
Fix direction: add a unit test beside test_config_unit.py:85 that sets a slash-terminated value; unset and blank cases stay as they are.
Size: S — label mayker:ready-for-fix set | label none
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — see the publish line's arm=
Reproduction: CORS_ORIGINS=http://localhost:5183/ with the backend running, then curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin (prints nothing). Needs the backend on port 8010. Not run here: analysis only.

## Evidence

```python
# backend/app/core/config.py
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

The existing tests (backend/tests/unit/test_config_unit.py:85-104) cover comma splitting, unset and blank values, but no trailing slash.
