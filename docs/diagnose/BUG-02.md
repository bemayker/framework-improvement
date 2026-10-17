DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's origin, and where?
Verdict: confirmed
Cause: backend/app/core/config.py:31-32 splits and strips entries but keeps a trailing "/", so "http://localhost:5183/" is stored verbatim.
Cause: backend/app/main.py:60 passes it to CORSMiddleware allow_origins, which compares exactly against the slash-less Origin header, so no Access-Control-Allow-Origin is sent.
Fix direction: In _read_cors_origins, strip a trailing "/" from each entry (entry.strip().rstrip("/")) before the empty check.
Fix direction: Add a unit test in backend/tests/unit/test_config_unit.py (slash entry resolves to slash-less origin); unset/blank paths are untouched.
Size: S
Questions: none
Noticed, not pursued: an entry of only "/" would become empty after rstrip and must be dropped by the existing empty filter, so apply rstrip before that filter.
Reproduction: CORS_ORIGINS=http://localhost:5183/ backend on :8010, then curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin (no output = defect); needs uv and the backend running.

## Evidence

```python
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

`backend/app/core/config.py:29-32`. `"http://localhost:5183/"` passes through unchanged; `backend/app/main.py:60` hands it to `CORSMiddleware(allow_origins=...)`, which matches the `Origin` header exactly.
