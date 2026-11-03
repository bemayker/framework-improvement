---
id: BUG-07
type: bug
title: Note text containing a NUL character returns 500 instead of 422
severity: low
status: todo
---

## Description

`NoteText` (`backend/app/schemas/note.py:15-20`) strips whitespace and bounds the length, but accepts control characters. A body such as `{"text": "a\u0000b"}` passes validation, reaches `NoteRepository.insert_note` (`backend/app/repositories/note_repository.py:26`), and PostgreSQL rejects NUL in `TEXT` (psycopg raises `DataError`). Nothing catches it: `note_service.create_note` logs and re-raises (`backend/app/services/note_service.py:30-32`), so the client gets an unhandled 500 for what is invalid client input.

## Evidence

```python
NoteText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=NOTE_TEXT_MAX_LENGTH),
]
```

No pattern or character check; `POST /api/notes` with a NUL in `text` is not a 422.

## Acceptance criteria

- [ ] `POST /api/notes` with text containing `\u0000` responds 422, not 500.
- [ ] Valid notes are unaffected.

Fix direction: reject NUL in the `NoteText` constraint (e.g. a `pattern` or validator) so the contract matches what the column can store.
