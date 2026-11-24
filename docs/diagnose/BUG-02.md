DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits and strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:52 passes it to CORSMiddleware, which compares it exactly against the slash-less browser Origin.
Fix direction: in `_read_cors_origins` (config.py:19), also `rstrip("/")` each entry; add a test that fails before and passes after.
Fix direction: keep the unset and blank path (falls through to DEFAULT_CORS_ORIGINS) unchanged.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — arm=PUBLISH_ARM
Reproduction: `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --set CORS_ORIGINS=http://localhost:5183/ -- uv run --directory backend python -c "from app.core.config import _read_cors_origins as r; print(r())"` (uv, backend deps); ran: printed `('http://localhost:5183/',)`, the slash kept, so it never equals the browser Origin

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```
