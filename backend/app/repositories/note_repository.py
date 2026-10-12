"""Data access for notes (TEST-03).

Raw parameterized SQL via psycopg: one table with an insert and a select
needs neither an ORM nor a query builder. The connection is supplied by the
caller (the `get_connection` dependency in app/core/db.py), so the repository
owns no transaction boundary of its own.
"""

import psycopg

from app.models.note import Note

INSERT_NOTE_SQL = "INSERT INTO notes (text) VALUES (%s) RETURNING id, text"
LIST_NOTES_SQL = "SELECT id, text FROM notes ORDER BY id"


class NoteRepository:
    """Reads and writes the `notes` table on a caller-provided connection."""

    def __init__(self, connection: psycopg.Connection) -> None:
        self._connection = connection

    def insert_note(self, text: str) -> Note:
        """Insert one note and return it with the identity the database assigned."""
        with self._connection.cursor() as cursor:
            cursor.execute(INSERT_NOTE_SQL, (text,))
            row = cursor.fetchone()
        return Note(id=row[0], text=row[1])

    def list_notes(self) -> list[Note]:
        """Return every stored note, ascending by id (insertion order)."""
        with self._connection.cursor() as cursor:
            cursor.execute(LIST_NOTES_SQL)
            rows = cursor.fetchall()
        return [Note(id=row[0], text=row[1]) for row in rows]
