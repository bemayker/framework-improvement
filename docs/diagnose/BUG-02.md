DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend?
Verdict: confirmed
Cause: backend/app/core/config.py:31 `_read_cors_origins` strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:51 passes it to `allow_origins`, which Starlette matches exactly against the slash-less browser `Origin`.
Fix direction: In `_read_cors_origins`, also `rstrip("/")` each entry (config.py:31), keeping the unset/blank fallback to `DEFAULT_CORS_ORIGINS`.
Fix direction: Add a test that fails before and passes after (settings-level and a `Origin` request asserting `access-control-allow-origin`).
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — published by publish.sh (arm in the run summary)
Reproduction: `CORS_ORIGINS=http://localhost:5183/` then GET /api/health with `Origin: http://localhost:5183` (backend only, `uv run --directory backend`); reproduced in-process with TestClient: status 503 (no DB), `access-control-allow-origin` = None.

## Evidence

```python
# backend/app/core/config.py
entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```
