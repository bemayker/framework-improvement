DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's slash-less Origin?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits and strips CORS_ORIGINS but keeps the trailing "/", so the entry never equals the browser's Origin.
Cause: backend/app/main.py:50 hands the list to CORSMiddleware, which compares origins by exact string, so no Access-Control-Allow-Origin is sent and nothing logs.
Fix direction: In _read_cors_origins, strip a trailing "/" from each entry (entry.strip().rstrip("/")) before the emptiness filter.
Fix direction: Unset and blank still fall back to DEFAULT_CORS_ORIGINS; add a unit test in test_config_unit.py and a CORS-header test via TestClient.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: uv run --directory backend python with CORS_ORIGINS=http://localhost:5183/ and TestClient(create_app()).get('/api/health', headers={'Origin': 'http://localhost:5183'}); access-control-allow-origin is None (observed: status 503 for the missing DATABASE_URL, header absent).

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:48-53
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    ...
)
```
