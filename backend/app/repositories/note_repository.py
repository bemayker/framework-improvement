"""Data access for notes (TEST-03). The only layer that speaks SQLAlchemy."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note


class NoteRepository:
    """Reads and writes `notes` rows through a SQLAlchemy session."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, text: str) -> Note:
        """Insert a note and return it with its generated id and timestamp.

        Flushes rather than commits: the transaction boundary belongs to the
        service layer. The refresh loads the database-generated `created_at`.
        """
        note = Note(text=text)
        self._session.add(note)
        self._session.flush()
        self._session.refresh(note)
        return note

    def list_all(self) -> list[Note]:
        """Return every note, newest first.

        `created_at` ties (rows written inside one transaction share the
        transaction timestamp in PostgreSQL) are broken by descending id, so the
        ordering is total and the most recent note is always first.
        """
        statement = select(Note).order_by(Note.created_at.desc(), Note.id.desc())
        return list(self._session.scalars(statement))

    def commit(self) -> None:
        """Commit the current unit of work, on behalf of the service layer."""
        self._session.commit()
