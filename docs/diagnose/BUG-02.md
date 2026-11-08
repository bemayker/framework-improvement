DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend?
Verdict: confirmed
Cause: backend/app/core/config.py:21 keeps each entry verbatim (only `.strip()`), so `http://localhost:5183/` is never normalised.
Cause: backend/app/main.py:50 passes it to CORSMiddleware, which compares it exactly to the slash-less `Origin` header, so no ACAO header is sent.
Fix direction: in `_read_cors_origins`, `rstrip("/")` each entry after strip, before the empty-entry filter.
Fix direction: unset/blank still falls back to DEFAULT_CORS_ORIGINS; add a unit test in test_config_unit.py (fails before, passes after).
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: start the backend with CORS_ORIGINS=http://localhost:5183/, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing (needs backend running on :8010). Not run live this session; confirmed by reading the code.

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:48-53
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```
