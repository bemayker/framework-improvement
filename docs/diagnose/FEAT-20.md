DIAGNOSE FEAT-20: does CORS_ORIGINS=http://a.test, http://b.test make get_settings().cors_origins keep the leading space on the second origin?
Verdict: not a bug
Cause: backend/app/core/config.py:21 strips every entry (`entry.strip()`) before the non-empty filter at :22, so the space after the comma never reaches `cors_origins`.
Fix direction: none, no change needed.
Size: none — label none
Questions: none
Noticed, not pursued: backend/app/core/config.py:22 does not de-duplicate entries (already diagnosed in docs/diagnose/FEAT-17.md).
Written: docs/diagnose/FEAT-20.md
Reproduction: `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --set "CORS_ORIGINS=http://a.test, http://b.test" -- uv run --directory backend python -c "from app.core.config import get_settings; print(get_settings().cors_origins)"`, needs uv and the backend dependencies; ran: printed `('http://a.test', 'http://b.test')`, no leading space

## Evidence

```python
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```
