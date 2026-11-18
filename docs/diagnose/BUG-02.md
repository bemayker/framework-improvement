DIAGNOSE BUG-02: Does a CORS_ORIGINS entry with a trailing slash fail to match the browser's Origin header?
Verdict: confirmed
Cause: backend/app/core/config.py:21-23 splits and strips CORS_ORIGINS but never removes a trailing "/" from an entry.
Cause: backend/app/main.py:52 passes the entries verbatim to CORSMiddleware, which compares them to the slashless Origin exactly.
Fix direction: In `_read_cors_origins`, `rstrip("/")` each entry before the empty-entry filter (config.py:22).
Fix direction: Add a test that sets CORS_ORIGINS=http://localhost:5183/ and expects the allow-origin header; unset/blank keeps the default.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: CORS_ORIGINS=http://localhost:5183/ backend on :8010, then `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin` prints nothing (static read of the code only; not run here)

## Evidence

```python
# backend/app/core/config.py:20-23
entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:50-53
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```

`"http://localhost:5183/"` is kept as is, and Starlette matches an origin by exact string equality, so `Origin: http://localhost:5183` never matches.
