DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash stop the browser's origin from matching?
Verdict: confirmed
Cause: backend/app/core/config.py:21 keeps each entry as typed (strip only), so `http://localhost:5183/` stays with its slash.
Cause: backend/app/main.py:50 hands the list to CORSMiddleware, which compares exact strings with the slashless `Origin` header, so no `Access-Control-Allow-Origin` is sent.
Fix direction: in `_read_cors_origins`, strip a trailing `/` from each entry (`entry.strip().rstrip("/")`) before the empty check.
Fix direction: add a unit test in backend/tests/unit/test_config_unit.py that sets a slashed value and fails before the fix; blank and unset keep the default.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: not run here (shape guard refused an env-prefixed command); the item's steps: start the backend with CORS_ORIGINS=http://localhost:5183/, then curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health and look for access-control-allow-origin.

## Evidence

```python
# backend/app/core/config.py
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:49-50
CORSMiddleware,
allow_origins=list(settings.cors_origins),
```
