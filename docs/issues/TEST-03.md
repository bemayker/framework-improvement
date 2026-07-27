---
id: TEST-03
type: feature
title: Simple note form
status: planning
branch: feature/TEST-03-simple-note-form
depends_on: [TEST-01]
scaffold: false
---

## Description / expected behaviour

Add a minimal note form to the landing page: a text input and a submit button that stores the note via the backend in PostgreSQL and shows the saved notes in a list. Deliberately trivial; exercises the fullstack slice (frontend, API, database) of the framework lifecycle.

## Acceptance criteria

- [ ] Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload.
- [ ] Submitting an empty note is rejected with a visible validation message and no API call.
- [ ] Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL).
