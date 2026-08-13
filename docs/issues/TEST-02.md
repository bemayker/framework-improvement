---
id: TEST-02
type: feature
title: Health endpoint
status: done
branch: feature/TEST-02-health-endpoint
depends_on: [TEST-01]
scaffold: false
---

## Description / expected behaviour

Add a health-check endpoint to the FastAPI backend so the frontend and CI can verify the backend is up. Deliberately trivial; exercises the backend slice of the framework lifecycle.

## Acceptance criteria

- [ ] `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}`.
- [ ] The endpoint reports database connectivity: when PostgreSQL is unreachable it returns HTTP 503 with `{"status": "degraded"}`.
