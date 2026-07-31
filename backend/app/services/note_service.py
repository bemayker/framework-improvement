"""Business logic for notes (TEST-03).

Deliberately thin: the only domain rule (a note must not be blank) is enforced
by the request schema, which FastAPI already answers with a machine-readable
422. What lives here is the transactional boundary (coding_standards.md
Section 2.2).
"""

import logging

import psycopg

from app.models.note import Note
from app.repositories import note_repository

logger = logging.getLogger(__name__)


def create_note(connection: psycopg.Connection, text: str) -> Note:
    """Store one note and commit.

    The text arrives already stripped by NoteCreateRequest, so it is stored
    verbatim. A failed insert is rolled back and re-raised: the router has no
    recovery for it, so it surfaces as a logged 500.
    """
    try:
        note = note_repository.insert_note(connection, text)
    except Exception:
        connection.rollback()
        logger.exception("Failed to insert a note; the transaction was rolled back.")
        raise
    connection.commit()
    return note


def list_notes(connection: psycopg.Connection) -> list[Note]:
    """Return every stored note, oldest first. Read-only, so nothing to commit."""
    try:
        return note_repository.select_notes(connection)
    except Exception:
        logger.exception("Failed to read the stored notes.")
        raise
