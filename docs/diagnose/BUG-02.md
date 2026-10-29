DIAGNOSE BUG-02: does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin?
Verdict: confirmed
Cause: backend/app/core/config.py:20 `_read_cors_origins` strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:51 passes it to CORSMiddleware `allow_origins`, which compares exactly against the slashless Origin header, so no ACAO header is sent.
Fix direction: in `_read_cors_origins`, also `rstrip("/")` each entry before the blank filter (a lone `/` then drops out like a blank).
Fix direction: add a unit test in backend/tests/unit/test_config_unit.py (slash entry resolves to the slashless origin), plus a preflight check in the integration tier.
Size: S — label mayker:ready-for-fix set (already carried by the item; no write needed)
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — see the publish line's arm=
Reproduction: CORS_ORIGINS=http://localhost:5183/ backend on :8010, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing (needs uv and the backend running; no database needed for /api/health).

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:49-54
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
```
