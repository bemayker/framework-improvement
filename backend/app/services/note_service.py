"""Business logic for notes (TEST-03), including the transaction boundary."""

import logging
from typing import Protocol

from app.core.exceptions import EmptyNoteError
from app.models.note import Note
from app.schemas.note import NoteCreate

logger = logging.getLogger(__name__)


class NoteRepositoryProtocol(Protocol):
    """The persistence contract this service depends on.

    Declared on the consumer side so the service can be unit-tested against a
    stub with no database (`coding_standards.md` Section 2.1).
    """

    def add(self, text: str) -> Note: ...

    def list_all(self) -> list[Note]: ...

    def commit(self) -> None: ...


class NoteService:
    """Creates and lists notes, owning the transactional boundary."""

    def __init__(self, repository: NoteRepositoryProtocol) -> None:
        self._repository = repository

    def create_note(self, payload: NoteCreate) -> Note:
        """Store a note, rejecting text that is blank once trimmed."""
        text = payload.text.strip()
        if not text:
            logger.warning("Rejected a note submission with blank text.")
            raise EmptyNoteError()

        note = self._repository.add(text)
        self._repository.commit()
        logger.info("Stored note id=%s with %d characters.", note.id, len(text))
        return note

    def list_notes(self) -> list[Note]:
        """Return every saved note, newest first."""
        return self._repository.list_all()
