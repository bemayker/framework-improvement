DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's slash-less Origin?
Verdict: confirmed
Cause: backend/app/core/config.py:34-36 `_read_cors_origins` strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:51 passes it unchanged to `CORSMiddleware(allow_origins=...)`, which compares by exact string to the request `Origin`, so no `Access-Control-Allow-Origin` is sent.
Fix direction: Strip trailing `/` from each entry in `_read_cors_origins` (`entry.strip().rstrip("/")`), keeping the unset/blank fallback to `DEFAULT_CORS_ORIGINS` as is.
Fix direction: Add a unit test in `backend/tests/unit/test_config_unit.py` (slash entry resolves to the slash-less origin; fails before, passes after).
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: A blank entry reduced to "" by `rstrip("/")` (an entry of just `/`) would need dropping after the strip, not before.
Written: docs/diagnose/BUG-02.md
Reproduction: Start the backend with `CORS_ORIGINS=http://localhost:5183/`, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` (prints nothing; needs the backend on :8010).

## Evidence

`backend/app/core/config.py`:

```python
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

`backend/app/main.py`:

```python
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```

Existing test `test_settings_cors_origins_parses_comma_separated_env_value` covers whitespace and empty entries only, not a trailing slash.
