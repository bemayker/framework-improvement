DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash stop the frontend's browser origin from matching?
Verdict: confirmed
Cause: backend/app/core/config.py:24-25 splits and strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:51 passes it to CORSMiddleware.allow_origins, which compares exact strings against the slash-less browser `Origin`, so no ACAO header is sent.
Fix direction: in `_read_cors_origins`, strip a trailing `/` from each entry (`entry.strip().rstrip("/")`), keeping the blank/unset fallback to DEFAULT_CORS_ORIGINS.
Fix direction: add a unit test in backend/tests/unit/test_config_unit.py (and an integration preflight/ACAO check) that fails before and passes after.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: `CORS_ORIGINS=http://localhost:5183/` backend on :8010, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` (no output = defect); needs the backend runnable locally.

## Evidence

```python
# backend/app/core/config.py:22-25
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:49-54
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
```
