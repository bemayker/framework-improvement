---
id: TEST-05
type: feature
title: Backend version endpoint
status: done
branch: feature/TEST-05-version-endpoint
depends_on: [TEST-01]
scaffold: false
---

## Description / expected behaviour

Add a version endpoint to the FastAPI backend that reports the application version from `backend/pyproject.toml` rather than a hardcoded string. Backend only; no frontend, no database. Deliberately trivial, and deliberately disjoint from TEST-04's frontend files so the two can build concurrently in a batch.

## Acceptance criteria

- [ ] `GET /api/version` returns HTTP 200 with JSON `{"version": "<the version from backend/pyproject.toml>"}`.
- [ ] The version is read from package metadata, not hardcoded in the router, service, or schema.
- [ ] The endpoint needs no database connection and answers correctly with `DATABASE_URL` unset.
