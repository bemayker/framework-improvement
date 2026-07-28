"""Business logic for notes (TEST-03).

The one rule this feature has lives here: a note's text is trimmed and must not
be blank. The repository is injectable so the rule is unit-testable without a
database.
"""

from sqlalchemy.orm import Session

from app.core.exceptions import EmptyNoteError
from app.models.note import Note
from app.repositories.note_repository import NoteRepository

DEFAULT_REPOSITORY = NoteRepository()


def create_note(
    session: Session, text: str, repository: NoteRepository = DEFAULT_REPOSITORY
) -> Note:
    """Store a trimmed note.

    Raises:
        EmptyNoteError: when ``text`` is blank or whitespace only.
    """
    trimmed = text.strip()
    if not trimmed:
        raise EmptyNoteError()
    return repository.add(session, trimmed)


def list_notes(
    session: Session, repository: NoteRepository = DEFAULT_REPOSITORY
) -> list[Note]:
    """Return every saved note, oldest first."""
    return repository.list_all(session)
