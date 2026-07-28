"""Data access for notes (TEST-03)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note


class NoteRepository:
    """Reads and writes ``notes`` rows. Holds no business rules."""

    def add(self, session: Session, text: str) -> Note:
        """Insert a note and return it with its server-generated columns filled."""
        note = Note(text=text)
        session.add(note)
        # Flush issues the INSERT and refresh reads back id and created_at, which
        # the database generates, so the caller can serialise the note directly.
        session.flush()
        session.refresh(note)
        return note

    def list_all(self, session: Session) -> list[Note]:
        """Return every note, oldest first (insertion order)."""
        return list(session.scalars(select(Note).order_by(Note.id)))
