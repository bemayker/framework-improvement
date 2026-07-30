"""Database access for notes (TEST-03)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note


class NoteRepository:
    """Reads and writes `Note` rows through a caller-supplied session.

    The repository does not commit: the request-scoped session dependency owns
    the transactional boundary (see `app.core.db`). It does `flush()`, so a
    constraint violation surfaces here rather than after the response.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, content: str) -> Note:
        """Insert a note and return it with its generated id and timestamp."""
        note = Note(content=content)
        self._session.add(note)
        self._session.flush()
        self._session.refresh(note)
        return note

    def list_all(self) -> list[Note]:
        """Return every note in insertion order (`id` ascending)."""
        return list(self._session.scalars(select(Note).order_by(Note.id)))
