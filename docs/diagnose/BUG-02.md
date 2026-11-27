DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash stop the browser's Origin from matching?
Verdict: confirmed
Cause: backend/app/core/config.py:20 `_read_cors_origins` only strips whitespace, so `http://localhost:5183/` stays as written.
Cause: backend/app/main.py:52 hands it to CORSMiddleware, which compares it exactly to the slash-less browser Origin, so no ACAO header is sent.
Fix direction: in `_read_cors_origins`, also `rstrip("/")` each entry (before the empty filter), keeping the unset/blank default path.
Fix direction: add a test that sets `CORS_ORIGINS=http://localhost:5183/` and expects `access-control-allow-origin: http://localhost:5183`.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — arm=pending-publish
Reproduction: `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --set CORS_ORIGINS=http://localhost:5183/ -- uv run --directory backend python -c "<TestClient GET /api/health with Origin: http://localhost:5183, print the access-control-allow-origin header>"`, needs backend deps via uv; ran: status 503 (no DATABASE_URL), `access-control-allow-origin` = None

## Evidence

```python
# backend/app/core/config.py
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS

# backend/app/main.py
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```
