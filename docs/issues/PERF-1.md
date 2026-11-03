---
id: PERF-1
type: perf
title: GET /api/notes returns every note with no bound
severity: low
status: todo
branch: feature/PERF-1-bound-notes-list
depends_on: []
scaffold: false
---

## Description

`LIST_NOTES_SQL` (`backend/app/repositories/note_repository.py:14`) has no `LIMIT`, and `list_notes` (`note_repository.py:30-35`, `backend/app/routers/notes.py:39-43`) loads every row into memory, builds a model per row and serialises them all in one response. Each note can be up to 500 characters (`backend/app/schemas/note.py:11`), and nothing caps the row count, so response size, memory and latency grow without bound as notes accumulate.

## Evidence

```python
LIST_NOTES_SQL = "SELECT id, text FROM notes ORDER BY id"
...
rows = cursor.fetchall()
return [Note(id=row[0], text=row[1]) for row in rows]
```

## Acceptance criteria

- [ ] `GET /api/notes` returns at most a fixed maximum number of notes.
- [ ] The cap is a named constant, and the frontend list still renders the returned notes.

Fix direction: add a `LIMIT` (newest or oldest N is a product call). Pagination is out of scope unless asked for.
