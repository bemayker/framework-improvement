---
id: BUG-07
type: bug
title: Note commit runs after the 201 is sent, so a note can be reported saved but not be readable or stored
severity: medium
status: todo
depends_on: []
---

## Description

`get_connection` (`backend/app/core/db.py:79-101`) commits after its `yield`, and it is a plain `Depends(get_connection)` (`backend/app/routers/notes.py:17`). With the installed FastAPI 0.139.2 the default dependency scope is `request`, so a yield dependency's exit code runs after the response has been sent. For `POST /api/notes` that means:

1. The client receives `201` with the new note before the transaction is committed. A client that immediately calls `GET /api/notes` (the frontend refetches after a save) can run on a second connection before the commit lands and not see the note it just created.
2. If `connection.commit()` fails (serialization, connection drop, disk full), the exception is raised after the 201 is on the wire. The client believes the note is stored, the `except` rolls back, and the note is lost. Only a server-side traceback records it.

## Evidence

Measured on the installed stack (`uv run --directory backend`, FastAPI 0.139.2) with a raw ASGI call against a yield dependency, recording event order:

```
['http.response.start', 'http.response.body:end', 'dep-exit']
```

`Depends` in this version accepts `scope: Literal['function', 'request']`; the default is `request`.

```python
# backend/app/core/db.py:93-101
connection = psycopg.connect(settings.database_url)
try:
    yield connection
    connection.commit()          # runs after the response was sent
except Exception:
    connection.rollback()
    raise
finally:
    connection.close()
```

## Acceptance criteria

- [ ] `POST /api/notes` returns 201 only after the insert is committed.
- [ ] A commit failure on `POST /api/notes` produces a 5xx response, not a 201.
- [ ] A `GET /api/notes` issued right after a 201 always includes the created note.
- [ ] A test covers the commit-failure case.

## Fix direction

Run the dependency's exit before the response is sent (`Depends(get_connection, scope="function")` on the connection dependency), or commit explicitly in the service/router path before returning. Prefer the smallest change.
