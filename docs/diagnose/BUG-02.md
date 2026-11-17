DIAGNOSE BUG-02: Why does a CORS_ORIGINS entry with a trailing slash block the frontend?
Verdict: confirmed
Cause: backend/app/core/config.py:19-22 `_read_cors_origins` strips whitespace only, so `http://localhost:5183/` is kept verbatim.
Cause: backend/app/main.py:52 hands it to CORSMiddleware `allow_origins`, which compares exactly with the browser's slashless Origin, so no ACAO header is sent.
Fix direction: in `_read_cors_origins`, `rstrip("/")` each entry after `strip()` (before the emptiness filter), leaving the unset/blank default path untouched.
Fix direction: add a unit test on `_read_cors_origins` / `get_settings` with a trailing-slash value, failing before and passing after.
Size: S — label mayker:ready-for-fix set
Questions: none
Noticed, not pursued: none
Written: docs/diagnose/BUG-02.md
Reproduction: UNAVAILABLE (not run: the TestClient repro command was refused by bash-shape-guard cd-segment, env-prefix); steps are in the item: start backend with CORS_ORIGINS=http://localhost:5183/, `curl -si -H 'Origin: http://localhost:5183' http://localhost:8010/api/health | grep -i access-control-allow-origin`, which prints nothing.

## Evidence

```python
# backend/app/core/config.py:19-22
def _read_cors_origins() -> tuple[str, ...]:
    entries = (entry.strip() for entry in (os.environ.get("CORS_ORIGINS") or "").split(","))
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS
```

```python
# backend/app/main.py:50-55
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), ...)
```
