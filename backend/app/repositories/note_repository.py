"""Data access for notes (TEST-03).

Raw parameterized SQL via psycopg: one table with an insert, two selects
(list and get by id) and a delete needs neither an ORM nor a query builder. The connection is supplied by the
caller (the `get_connection` dependency in app/core/db.py), so the repository
owns no transaction boundary of its own.
"""

import psycopg

from app.models.note import Note

INSERT_NOTE_SQL = "INSERT INTO notes (text) VALUES (%s) RETURNING id, text"
LIST_NOTES_SQL = "SELECT id, text FROM notes ORDER BY id"
GET_NOTE_SQL = "SELECT id, text FROM notes WHERE id = %s"
DELETE_NOTE_SQL = "DELETE FROM notes WHERE id = %s"


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

    def get_note(self, note_id: int) -> Note | None:
        """Return the note with this id, or None when no such note is stored."""
        with self._connection.cursor() as cursor:
            cursor.execute(GET_NOTE_SQL, (note_id,))
            row = cursor.fetchone()
        return None if row is None else Note(id=row[0], text=row[1])

    def delete_note(self, note_id: int) -> bool:
        """Delete the note with this id; True when a note was removed, False on a miss."""
        with self._connection.cursor() as cursor:
            cursor.execute(DELETE_NOTE_SQL, (note_id,))
            return cursor.rowcount > 0
