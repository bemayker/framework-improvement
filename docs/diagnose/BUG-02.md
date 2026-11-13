DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the browser's origin?
Verdict: confirmed
Cause: backend/app/core/config.py:20 `_read_cors_origins` strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:50 passes it to CORSMiddleware `allow_origins`, which compares exact strings against the slash-less `Origin` header, so no ACAO header is sent.
Fix direction: In `_read_cors_origins`, strip a trailing `/` from each entry (`entry.strip().rstrip("/")`), keeping the unset/blank fallback to DEFAULT_CORS_ORIGINS.
Fix direction: Add a unit test in backend/tests/unit/test_config_unit.py (e.g. `http://localhost:5183/` -> `("http://localhost:5183",)`); it fails before the change and passes after.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — arm=PUBLISH_ARM
Reproduction: CORS_ORIGINS=http://localhost:5183/ uv run --directory backend uvicorn app.main:app --port 8010, then curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin (no header returned); needs the DATABASE_URL backing service for startup.

## Evidence

```python
# backend/app/core/config.py
entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py
allow_origins=list(settings.cors_origins),
```

The existing tests (test_config_unit.py:85-104) cover comma splitting, stripping whitespace, unset and blank, but none covers a trailing slash.
