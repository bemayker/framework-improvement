DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash still fail to match the browser's Origin, so no Access-Control-Allow-Origin is sent?
Verdict: confirmed
Cause: backend/app/core/config.py:26 strips whitespace only, so `http://localhost:5183/` reaches CORSMiddleware (backend/app/main.py:60) verbatim and never equals `Origin: http://localhost:5183`.
       The #76 fix (`.rstrip("/")`, ad5c8a8) was lost when the sandbox reset (#83) and #85 rewrote `_read_cors_origins`.
Fix direction: drop a trailing `/` from each entry in `_read_cors_origins`; the existing empty-entry filter keeps unset/blank on the default.
               Add a unit test with `CORS_ORIGINS=http://localhost:5183/` asserting the header is returned (fails now, passes after).
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md — see publish line
Reproduction: `uv run --directory backend python -c` setting `os.environ["CORS_ORIGINS"]="http://localhost:5183/"`, then `TestClient(create_app()).get("/api/health", headers={"Origin": "http://localhost:5183"})` → `200 None` (no access-control-allow-origin); no database needed.

## Evidence

```python
# backend/app/core/config.py:24-27 (main, 77c881a)
def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given."""
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```
$ uv run --directory backend python -c '...CORS_ORIGINS="http://localhost:5183/"...'
200 None
```
