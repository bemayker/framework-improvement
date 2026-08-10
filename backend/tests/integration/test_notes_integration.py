"""Integration tests for the notes slice (TEST-03).

The repository runs against a real PostgreSQL instance and the endpoints run
through the full HTTP request/response cycle (testing_standards.md Section 1.2).
Each test starts from an empty `notes` table via the `notes_table` fixture, so
the tests are order-independent.
"""

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.repositories.note_repository import NoteRepository
from app.schemas.note import NOTE_TEXT_MAX_LENGTH


def test_insert_note_then_list_notes_round_trips_through_postgres(
    notes_table: psycopg.Connection,
):
    """Repository insert + retrieve round-trip against the real database."""
    repository = NoteRepository(notes_table)

    created = repository.insert_note("Buy milk")

    assert created.id > 0
    assert created.text == "Buy milk"
    assert repository.list_notes() == [created]


def test_list_notes_returns_notes_ascending_by_id(notes_table: psycopg.Connection):
    """Insertion order is what the query guarantees (plan assumption 2)."""
    repository = NoteRepository(notes_table)

    first = repository.insert_note("first")
    second = repository.insert_note("second")

    assert first.id < second.id
    assert [note.text for note in repository.list_notes()] == ["first", "second"]


def test_list_notes_returns_empty_list_when_table_is_empty(
    notes_table: psycopg.Connection,
):
    """Edge case: an empty result set, not an error."""
    assert NoteRepository(notes_table).list_notes() == []


def test_insert_note_with_blank_text_violates_the_check_constraint(
    notes_table: psycopg.Connection,
):
    """The no-blank-note rule is enforced by the database, not only by the schema."""
    repository = NoteRepository(notes_table)

    with pytest.raises(psycopg.errors.CheckViolation):
        repository.insert_note("   ")

    notes_table.rollback()


def test_post_notes_returns_201_with_the_created_note(
    client: TestClient, notes_table: psycopg.Connection
):
    """Criterion 1 at the API layer: a note is stored and echoed back with its id."""
    response = client.post("/api/notes", json={"text": "Buy milk"})

    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "Buy milk"
    assert isinstance(body["id"], int)


def test_get_notes_returns_the_notes_created_through_the_api(
    client: TestClient, notes_table: psycopg.Connection
):
    """Criterion 3 at the API layer: a later request reads them back from PostgreSQL."""
    client.post("/api/notes", json={"text": "Buy milk"})
    client.post("/api/notes", json={"text": "Walk dog"})

    response = client.get("/api/notes")

    assert response.status_code == 200
    assert [note["text"] for note in response.json()] == ["Buy milk", "Walk dog"]


def test_get_notes_returns_empty_list_when_no_notes_exist(
    client: TestClient, notes_table: psycopg.Connection
):
    """Edge case: the empty collection is `[]`, with a 200."""
    response = client.get("/api/notes")

    assert response.status_code == 200
    assert response.json() == []


def test_post_notes_strips_surrounding_whitespace(
    client: TestClient, notes_table: psycopg.Connection
):
    """Edge case: padding is trimmed before the note is stored."""
    response = client.post("/api/notes", json={"text": "  Buy milk  "})

    assert response.status_code == 201
    assert response.json()["text"] == "Buy milk"


def test_post_notes_with_empty_text_returns_422(
    client: TestClient, notes_table: psycopg.Connection
):
    """Error case: an empty note is rejected by the request schema."""
    response = client.post("/api/notes", json={"text": ""})

    assert response.status_code == 422
    assert client.get("/api/notes").json() == []


def test_post_notes_with_whitespace_only_text_returns_422(
    client: TestClient, notes_table: psycopg.Connection
):
    """Error case: whitespace-only counts as empty (plan assumption 1)."""
    response = client.post("/api/notes", json={"text": "   "})

    assert response.status_code == 422
    assert client.get("/api/notes").json() == []


def test_post_notes_without_text_field_returns_422(
    client: TestClient, notes_table: psycopg.Connection
):
    """Error case: a missing field is a contract violation, not an empty note."""
    response = client.post("/api/notes", json={})

    assert response.status_code == 422


def test_post_notes_at_the_maximum_length_is_accepted_and_stored(
    client: TestClient, notes_table: psycopg.Connection
):
    """Boundary case: exactly the maximum length is still a valid note."""
    longest_allowed = "a" * NOTE_TEXT_MAX_LENGTH

    response = client.post("/api/notes", json={"text": longest_allowed})

    assert response.status_code == 201
    assert response.json()["text"] == longest_allowed
    assert [note["text"] for note in client.get("/api/notes").json()] == [
        longest_allowed
    ]


def test_post_notes_over_the_maximum_length_returns_422_and_stores_nothing(
    client: TestClient, notes_table: psycopg.Connection
):
    """Boundary case: one character past the bound is rejected before the insert."""
    response = client.post("/api/notes", json={"text": "a" * (NOTE_TEXT_MAX_LENGTH + 1)})

    assert response.status_code == 422
    assert client.get("/api/notes").json() == []
