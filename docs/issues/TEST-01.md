---
id: TEST-01
type: feature
title: Static landing page
status: planning
branch: feature/TEST-01-static-landing-page
depends_on: []
scaffold: true
---

## Description / expected behaviour

The scaffold feature: create the initial project structure (React + TypeScript + Vite frontend, FastAPI backend managed with uv, Docker Compose with PostgreSQL, test infrastructure per CLAUDE.md Test Configuration) and serve a static landing page as the first visible output. Deliberately trivial; it exists to bootstrap the repo for the other sandbox features.

## Acceptance criteria

- [ ] Visiting the app root (http://localhost:5173) shows a landing page with the app title "Task Notes".
- [ ] The project structure, test infrastructure, and Docker Compose setup are in place, and all test tiers run green (or as clean no-ops where no tests exist yet).
