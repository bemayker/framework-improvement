"""Business logic for notes. Owns the transactional boundary (`coding_standards.md` Section 2.2)."""

import logging

from app.core.exceptions import EmptyNoteError
from app.models.note import Note
from app.repositories.note_repository import NoteRepository
from app.schemas.note import NoteCreate

logger = logging.getLogger(__name__)


class NoteService:
    def __init__(self, repository: NoteRepository) -> None:
        self._repository = repository

    def create_note(self, payload: NoteCreate) -> Note:
        """Trim the note text and persist it, or raise if nothing remains."""
        text = payload.text.strip()
        if not text:
            logger.info("Rejected note creation: text was empty after trimming.")
            raise EmptyNoteError()

        note = self._repository.add(text)
        self._repository.session.commit()
        return note

    def list_notes(self) -> list[Note]:
        return self._repository.list_all()
