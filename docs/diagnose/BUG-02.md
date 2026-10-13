DIAGNOSE BUG-02: does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin?
Verdict: confirmed
Cause: backend/app/core/config.py:24-25 only strips whitespace from each entry, so "http://localhost:5183/" is kept as is.
backend/app/main.py:59 passes it unchanged to CORSMiddleware allow_origins, which compares exact strings against the slash-less Origin.
Fix direction: in `_read_cors_origins`, also strip a trailing "/" from each entry (`entry.strip().rstrip("/")`), keeping the blank-entry filter and default fallback.
Size: S — label mayker:ready-for-fix
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: `CORS_ORIGINS=http://localhost:5183/ uv run --directory backend python -c "from app.core.config import get_settings; print(get_settings().cors_origins)"` prints `('http://localhost:5183/',)`; the item's curl against :8010 needs the backend running.

## Evidence

```python
# backend/app/core/config.py:22-25
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

No test in backend/tests/unit/test_config_unit.py covers a trailing slash.
