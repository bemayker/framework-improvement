DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend?
Verdict: confirmed
Cause: backend/app/core/config.py:21-22 splits and strips whitespace only, so "http://localhost:5183/" is kept verbatim.
Cause: backend/app/main.py:57 passes it to CORSMiddleware allow_origins, which compares exactly with the browser's slashless Origin, so no ACAO header is sent.
Fix direction: in _read_cors_origins, also strip trailing "/" from each entry (entry.strip().rstrip("/")) before the empty-entry filter.
Fix direction: add a unit test in backend/tests/unit/test_config_unit.py (fails before, passes after); unset/blank paths stay untouched.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: an entry of just "/" would become empty after rstrip; the existing empty-entry filter must run after the strip so it falls back to the default.
Written: docs/diagnose/BUG-02.md — see publish arm below
Reproduction: CORS_ORIGINS=http://localhost:5183/ uv run --directory backend uvicorn app.main:app --port 8010, then curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin (no header returned)

## Evidence

```python
# backend/app/core/config.py:21-22
entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:56-57
CORSMiddleware,
allow_origins=list(settings.cors_origins),
```
