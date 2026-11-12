---
id: BUG-07
type: bug
title: POST /api/notes can answer 201 for a note whose commit then fails
severity: low
status: todo
---

## Description

`get_connection` (`backend/app/core/db.py:79-101`) commits after `yield`. The installed FastAPI (0.139.2, `backend/uv.lock`) runs a yield dependency's exit code after the response has been sent unless the dependency is declared `scope="function"`. `create_note` (`backend/app/routers/notes.py:31-36`) returns the 201 body as soon as `INSERT ... RETURNING` succeeds, so a failure at `connection.commit()` (connection dropped, serialization or deferred-constraint error) is raised after the client already received `201` with an id. The `except Exception: rollback; raise` branch then runs with nobody to tell, and the note is not stored.

Consequence: a client (the frontend list, E2E) can show a saved note that `GET /api/notes` never returns.

## Evidence

```python
connection = psycopg.connect(settings.database_url)
try:
    yield connection
    connection.commit()        # runs after the 201 has been sent
except Exception:
    connection.rollback()
    raise
```

## Acceptance criteria

- [ ] When the commit of a `POST /api/notes` fails, the client does not receive a 2xx.
- [ ] A successful `POST /api/notes` still returns 201 with the stored id, and `GET /api/notes` lists it.
- [ ] A test fails the commit (for example a connection whose `commit` raises) and asserts a non-2xx response.

Fix direction: commit in the repository or service write path, or give the dependency `scope="function"` so its exit runs before the response is sent.
