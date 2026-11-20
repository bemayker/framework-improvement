DIAGNOSE FEAT-17: does CORS_ORIGINS=http://a.test,http://a.test make get_settings().cors_origins keep http://a.test twice?
Verdict: confirmed
Cause: backend/app/core/config.py:19-22 `_read_cors_origins` splits, strips and drops blanks, but never de-duplicates; backend/app/main.py:52 passes the list on as `allow_origins`.
Fix direction: de-duplicate while keeping first-seen order, e.g. `tuple(dict.fromkeys(...))` over the non-empty entries.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/FEAT-17.md
Reproduction: `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --set CORS_ORIGINS=http://a.test,http://a.test -- uv run --directory backend python -c "from app.core.config import get_settings; print(get_settings().cors_origins)"`, needs uv and the backend dependencies; ran: printed `('http://a.test', 'http://a.test')`

## Evidence

```python
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```
