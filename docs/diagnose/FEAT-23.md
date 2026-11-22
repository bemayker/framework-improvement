DIAGNOSE FEAT-23: why does get_settings().cors_origins keep duplicate CORS_ORIGINS entries?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 `_read_cors_origins` splits, strips and drops blanks but has no de-duplication step, so nothing was ever meant to keep or remove repeats; backend/app/main.py:52 passes the list on as `allow_origins`.
Fix direction: de-duplicate while keeping first-seen order, e.g. `tuple(dict.fromkeys(entry for entry in entries if entry))`.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/FEAT-23.md
Reproduction: `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --set CORS_ORIGINS=http://a.test,http://a.test -- uv run --directory backend python -c "from app.core.config import get_settings; print(get_settings().cors_origins)"`, needs uv and the backend dependencies; ran: printed `('http://a.test', 'http://a.test')`

## Evidence

```python
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

No test, comment or doc under backend/ or docs/ mentions duplicates, so keeping them is an omission, not a decision.
