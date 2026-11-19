DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash stop matching the browser's Origin?
Verdict: confirmed
Cause: backend/app/core/config.py:20 `_read_cors_origins` strips whitespace only and keeps the trailing `/`.
Cause: backend/app/main.py:49 passes the entries unchanged to CORSMiddleware `allow_origins`, which matches exact strings, so `http://localhost:5183/` never equals `http://localhost:5183`.
Fix direction: In `_read_cors_origins`, `rstrip("/")` each entry after the strip and before the empty filter, so blank input still falls to the default.
Fix direction: Add unit tests in backend/tests/unit/test_config_unit.py: slash entry normalised (fails before, passes after), unset and blank unchanged.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: CORS_ORIGINS=http://localhost:5183/ python -c "from app.core.config import get_settings; print(get_settings().cors_origins)" from backend/ (prints ('http://localhost:5183/',)); or the item's curl against a running backend.

## Evidence

```python
# backend/app/core/config.py
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS

# backend/app/main.py
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```

An entry `"/"` alone would become empty after `rstrip("/")`; filter after normalising so it falls to the default.
