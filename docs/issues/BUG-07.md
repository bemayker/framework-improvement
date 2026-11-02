---
id: BUG-07
type: bug
title: Health endpoint response carries no Cache-Control directive
status: todo
severity: medium
depends_on: []
scaffold: false
---

## Description

`GET /api/health` (`backend/app/routers/health.py:17-33`) returns a `JSONResponse` with no `Cache-Control` header. `backend/app/routers/server_time.py:8-18` documents that the CDN in front of the deployed API caches responses that carry no cache directive, and fixes that for `/api/time` with `no-store`. The health probe has the same exposure: a cached 200 `ok` keeps being served after the database goes away (or a cached 503 after it recovers), so the probe reports a state the backend is no longer in. A probe answered from a cache is not a probe.

## Evidence

```python
# backend/app/routers/health.py
return JSONResponse(status_code=status_code, content=body.model_dump())
```

```python
# backend/app/routers/server_time.py
NO_STORE_CACHE_CONTROL = "no-store"
...
response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL
```

## Acceptance criteria

- [ ] A 200 response from `GET /api/health` carries `Cache-Control: no-store`.
- [ ] A 503 response from `GET /api/health` carries `Cache-Control: no-store`.
- [ ] The existing status codes and JSON bodies are unchanged.

## Fix direction

Set the header on the `JSONResponse` in `get_health` (the response is built by hand, so the injected `Response` parameter would not apply). Reuse the `no-store` value rather than adding a second literal.
