"""Data access for the `notes` table (TEST-03).

Plain parameterized SQL through psycopg. No ORM: one table with two queries
does not justify one (see the plan's Technology Selection).
"""

import psycopg

from app.models.note import Note

INSERT_NOTE = "INSERT INTO notes (text) VALUES (%s) RETURNING id, text, created_at"
SELECT_NOTES = "SELECT id, text, created_at FROM notes ORDER BY id ASC"


def insert_note(connection: psycopg.Connection, text: str) -> Note:
    """Insert one note and return it as stored, including its generated id."""
    with connection.cursor() as cursor:
        cursor.execute(INSERT_NOTE, (text,))
        row = cursor.fetchone()
    return Note(id=row[0], text=row[1], created_at=row[2])


def select_notes(connection: psycopg.Connection) -> list[Note]:
    """Return every note, oldest first (ascending id, i.e. insertion order)."""
    with connection.cursor() as cursor:
        cursor.execute(SELECT_NOTES)
        rows = cursor.fetchall()
    return [Note(id=row[0], text=row[1], created_at=row[2]) for row in rows]
