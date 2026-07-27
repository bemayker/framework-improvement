"""Repository layer for the notes resource: talks to the database only."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note


class NoteRepository:
    """Data access for `Note`, over a SQLAlchemy `Session`."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, content: str) -> Note:
        """Adds a note and flushes so its generated `id`/`created_at` populate.

        Does not commit: the transactional boundary belongs to the service.
        """
        note = Note(content=content)
        self._session.add(note)
        self._session.flush()
        return note

    def list_all(self) -> list[Note]:
        """Returns all notes, oldest first (insertion order, Assumption A4)."""
        return list(self._session.scalars(select(Note).order_by(Note.id)))
