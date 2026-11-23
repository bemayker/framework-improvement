DIAGNOSE BUG-02: does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin, so no Access-Control-Allow-Origin header is sent?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits and strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:52 passes it to CORSMiddleware, which compares the origin exactly, so `Origin: http://localhost:5183` never matches.
Fix direction: in `_read_cors_origins`, strip a trailing `/` from each entry (`entry.strip().rstrip("/")`), keeping the blank-entry filter and default.
Fix direction: add a unit test in backend/tests/unit/test_config_unit.py that fails before and passes after, plus the unset and blank cases unchanged.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — arm=PUBLISH_ARM
Reproduction: `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --set CORS_ORIGINS=http://localhost:5183/ -- uv run --directory backend python -c "from fastapi.testclient import TestClient; from app.main import create_app; r=TestClient(create_app()).get('/api/health', headers={'Origin':'http://localhost:5183'}); print(r.headers.get('access-control-allow-origin'))"`, needs the backend venv, no database; ran: printed `None` (expected `http://localhost:5183`)

## Evidence

```python
# backend/app/core/config.py
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

With `CORS_ORIGINS=http://localhost:5183/` and request header `Origin: http://localhost:5183`, the response carried no `access-control-allow-origin` header (status 503 only because no database is configured; unrelated).
