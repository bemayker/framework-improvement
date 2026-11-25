DIAGNOSE BUG-02: does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin header?
Verdict: confirmed
Cause: backend/app/core/config.py:19-22 `_read_cors_origins` strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:52 passes it to CORSMiddleware, which matches Origin by exact string, so `http://localhost:5183` never matches.
Fix direction: in `_read_cors_origins` also `rstrip("/")` each entry (backend only, one function).
Fix direction: add a test that fails before and passes after; unset and blank behaviour stays the default.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — arm=see publish line
Reproduction: `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --set CORS_ORIGINS=http://localhost:5183/ -- uv run --directory backend python -c "from fastapi.testclient import TestClient; from app.main import app; r=TestClient(app).get('/api/health',headers={'Origin':'http://localhost:5183'}); print(r.status_code, r.headers.get('access-control-allow-origin'))"`, needs backend deps via uv; ran: printed `503 None`, so no Access-Control-Allow-Origin header (503 is only the unconfigured DB; the header is absent regardless of status)

## Evidence

```python
# backend/app/core/config.py
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```
