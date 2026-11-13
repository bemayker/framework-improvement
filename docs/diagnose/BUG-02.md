DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's slash-less Origin, and where?
Verdict: confirmed
Cause: backend/app/core/config.py:21 strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:50 hands it to CORSMiddleware, which compares Origin exactly, so no Access-Control-Allow-Origin is sent.
Fix direction: In `_read_cors_origins` (config.py:19-22) also `rstrip("/")` each entry before the empty check; blank/unset still falls to the default.
Fix direction: Add a unit test in backend/tests/unit/test_config_unit.py and an Origin-header test that fails before and passes after.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: With CORS_ORIGINS=http://localhost:5183/, GET /api/health with header `Origin: http://localhost:5183` (in-process TestClient, backend venv): response has no access-control-allow-origin (observed 503 None, DATABASE_URL unset, header absent regardless).

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```
