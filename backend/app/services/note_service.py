"""Service layer for the notes resource: business logic and transactions."""

import logging

from sqlalchemy.orm import Session

from app.core.exceptions import EmptyNoteError
from app.models.note import Note
from app.repositories.note_repository import NoteRepository

logger = logging.getLogger(__name__)


class NoteService:
    """Owns the notes business rules and the transactional boundary."""

    def __init__(self, session: Session, repository: NoteRepository | None = None) -> None:
        self._session = session
        self._repository = repository or NoteRepository(session)

    def create_note(self, content: str) -> Note:
        """Stores a note, trimmed, rejecting empty/whitespace-only content.

        Raises:
            EmptyNoteError: if the trimmed content is empty.
        """
        trimmed = content.strip()
        if not trimmed:
            logger.warning("Rejected note creation: content was empty after trimming.")
            raise EmptyNoteError()

        note = self._repository.add(trimmed)
        self._session.commit()
        return note

    def list_notes(self) -> list[Note]:
        """Returns all stored notes, oldest first."""
        return self._repository.list_all()
