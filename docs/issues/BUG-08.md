---
id: BUG-08
type: bug
title: Note writes are committed after the response is sent, so a 201 can precede the commit
severity: medium
status: todo
branch: feature/BUG-08-commit-before-response
depends_on: []
scaffold: false
---

## Description

`get_connection` (`backend/app/core/db.py:93-101`) is a FastAPI dependency with `yield`, and it commits in the code after the `yield` (`connection.commit()`, line 96). The locked FastAPI is 0.139.2 (`backend/uv.lock`); since FastAPI 0.118 the exit code of a yield dependency runs after the response has been sent. `POST /api/notes` therefore returns `201` before the INSERT is committed:

- a client that issues `GET /api/notes` right after the 201 (the frontend list refresh) runs on a different connection and can miss the new note, and
- if `commit()` fails, the failure surfaces after the client was already told the note was stored, so it is logged but never reported.

The in-process `TestClient` waits for the dependency exit, so the existing integration tests cannot see this.

## Evidence

```python
# backend/app/core/db.py
connection = psycopg.connect(settings.database_url)
try:
    yield connection
    connection.commit()
except Exception:
    connection.rollback()
    raise
```

## Acceptance criteria

- [ ] `POST /api/notes` returns 201 only after the insert is committed.
- [ ] A failing commit produces an error response, not a 201.
- [ ] Existing notes endpoint behaviour (201 body, 422 on blank, list ordering) is unchanged.

Fix direction: commit explicitly in the write path before returning (for example in `note_service.create_note` or the router), leaving `get_connection` to roll back and close. Confirm the exit-after-response behaviour against the installed FastAPI before changing it.
