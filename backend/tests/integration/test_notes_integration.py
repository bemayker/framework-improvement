"""Integration tests for the notes feature (TEST-03).

Repository round-trips run against real PostgreSQL and the router runs through
the full HTTP request/response cycle (testing_standards.md Section 1.2).
Isolation comes from the `notes_table` fixture, which truncates before every
test, so no test depends on another having run.
"""

import psycopg
from fastapi.testclient import TestClient

from app.repositories import note_repository


def test_insert_note_then_select_notes_returns_the_stored_note(
    notes_table: psycopg.Connection,
):
    """Repository round-trip: what is inserted comes back with a generated id."""
    inserted = note_repository.insert_note(notes_table, "Buy milk")
    notes_table.commit()

    stored = note_repository.select_notes(notes_table)

    assert [note.text for note in stored] == ["Buy milk"]
    assert stored[0].id == inserted.id
    assert stored[0].created_at == inserted.created_at


def test_select_notes_returns_empty_list_when_the_table_is_empty(
    notes_table: psycopg.Connection,
):
    """Repository edge case: an empty result set is an empty list."""
    assert note_repository.select_notes(notes_table) == []


def test_select_notes_orders_oldest_first(notes_table: psycopg.Connection):
    """Repository ordering: ascending id, i.e. insertion order (plan assumption)."""
    note_repository.insert_note(notes_table, "First")
    note_repository.insert_note(notes_table, "Second")
    note_repository.insert_note(notes_table, "Third")
    notes_table.commit()

    stored = note_repository.select_notes(notes_table)

    assert [note.text for note in stored] == ["First", "Second", "Third"]
    assert [note.id for note in stored] == sorted(note.id for note in stored)


def test_post_notes_returns_201_with_the_created_note(
    client: TestClient, notes_table: psycopg.Connection
):
    """Router happy path: POST /api/notes creates the note and echoes it back."""
    response = client.post("/api/notes", json={"text": "Buy milk"})

    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "Buy milk"
    assert isinstance(body["id"], int)
    assert body["created_at"]


def test_post_notes_persists_the_note_to_postgresql(
    client: TestClient, notes_table: psycopg.Connection
):
    """Criterion 3: the row the endpoint created is really in the database."""
    client.post("/api/notes", json={"text": "Buy milk"})

    stored = note_repository.select_notes(notes_table)

    assert [note.text for note in stored] == ["Buy milk"]


def test_post_notes_strips_surrounding_whitespace_before_storing(
    client: TestClient, notes_table: psycopg.Connection
):
    """Router edge case: the stored text is the stripped text, not the raw input."""
    response = client.post("/api/notes", json={"text": "  Buy milk  "})

    assert response.status_code == 201
    assert response.json()["text"] == "Buy milk"


def test_get_notes_returns_200_with_the_stored_notes(
    client: TestClient, notes_table: psycopg.Connection
):
    """Router happy path: GET /api/notes serves what POST stored, oldest first."""
    client.post("/api/notes", json={"text": "First"})
    client.post("/api/notes", json={"text": "Second"})

    response = client.get("/api/notes")

    assert response.status_code == 200
    assert [note["text"] for note in response.json()] == ["First", "Second"]


def test_get_notes_returns_an_empty_array_when_none_exist(
    client: TestClient, notes_table: psycopg.Connection
):
    """Router edge case: no notes is an empty array, not a 404."""
    response = client.get("/api/notes")

    assert response.status_code == 200
    assert response.json() == []


def test_post_notes_returns_422_for_blank_text(
    client: TestClient, notes_table: psycopg.Connection
):
    """Router error case: whitespace-only text is rejected and nothing is stored."""
    response = client.post("/api/notes", json={"text": "   "})

    assert response.status_code == 422
    assert note_repository.select_notes(notes_table) == []


def test_post_notes_returns_422_when_text_is_missing(
    client: TestClient, notes_table: psycopg.Connection
):
    """Router error case: a body without `text` is rejected the same way."""
    response = client.post("/api/notes", json={})

    assert response.status_code == 422
    assert note_repository.select_notes(notes_table) == []
