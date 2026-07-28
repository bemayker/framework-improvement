"""Data access for notes. SQLAlchemy only lives here (`coding_standards.md` Section 2.2)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note


class NoteRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, text: str) -> Note:
        """Add a note and flush so the generated `id`/`created_at` are populated.

        Does not commit: the transactional boundary belongs to the service
        layer.
        """
        note = Note(text=text)
        self.session.add(note)
        self.session.flush()
        return note

    def list_all(self) -> list[Note]:
        """Return all notes, newest first (ties broken by id, also descending)."""
        statement = select(Note).order_by(Note.created_at.desc(), Note.id.desc())
        return list(self.session.scalars(statement))
