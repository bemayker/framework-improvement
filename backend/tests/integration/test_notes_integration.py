"""Integration tests for the notes slice (TEST-03), against real PostgreSQL.

Two layers, per `testing_standards.md` Section 1.2: the repository against real
SQL, and the router through the full HTTP request/response cycle. Nothing is
mocked; the fixtures live in backend/tests/conftest.py.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.repositories.note_repository import NoteRepository


def test_add_then_list_all_returns_the_saved_note(db_session: Session):
    """Repository happy path: insert and retrieve round-trip."""
    repository = NoteRepository(db_session)

    created = repository.add("Buy milk")
    db_session.commit()

    listed = NoteRepository(db_session).list_all()
    assert [note.content for note in listed] == ["Buy milk"]
    assert created.id is not None
    assert created.created_at is not None


def test_list_all_returns_notes_in_insertion_order(db_session: Session):
    """Repository edge case: ordering is by id ascending, not arbitrary."""
    repository = NoteRepository(db_session)
    for content in ("first", "second", "third"):
        repository.add(content)
    db_session.commit()

    listed = repository.list_all()

    assert [note.content for note in listed] == ["first", "second", "third"]
    assert [note.id for note in listed] == sorted(note.id for note in listed)


def test_list_all_returns_empty_list_when_no_notes_exist(db_session: Session):
    """Repository edge case: an empty table yields an empty list."""
    assert NoteRepository(db_session).list_all() == []


def test_post_notes_returns_201_with_the_created_note(db_client: TestClient):
    """Router happy path: the documented 201 response shape."""
    response = db_client.post("/api/notes", json={"content": "Buy milk"})

    assert response.status_code == 201
    body = response.json()
    assert body["content"] == "Buy milk"
    assert isinstance(body["id"], int)
    assert body["created_at"]


def test_post_notes_trims_content_before_storing(db_client: TestClient):
    """Router edge case: padding is stripped, and the stored value is returned."""
    response = db_client.post("/api/notes", json={"content": "  Walk the dog  "})

    assert response.status_code == 201
    assert response.json()["content"] == "Walk the dog"
    assert db_client.get("/api/notes").json()[0]["content"] == "Walk the dog"


def test_post_notes_with_whitespace_only_content_returns_422(db_client: TestClient):
    """Router error case: whitespace-only counts as empty and nothing is stored."""
    response = db_client.post("/api/notes", json={"content": "   "})

    assert response.status_code == 422
    assert db_client.get("/api/notes").json() == []


def test_post_notes_without_content_returns_422(db_client: TestClient):
    """Router error case: a missing field is a schema violation."""
    response = db_client.post("/api/notes", json={})

    assert response.status_code == 422


def test_get_notes_returns_empty_list_when_none_stored(db_client: TestClient):
    """Router edge case: no notes yet is 200 with an empty list."""
    response = db_client.get("/api/notes")

    assert response.status_code == 200
    assert response.json() == []


def test_get_notes_returns_stored_notes_in_insertion_order(db_client: TestClient):
    """Router happy path: notes persist across requests, ordered by id."""
    for content in ("first", "second"):
        assert db_client.post("/api/notes", json={"content": content}).status_code == 201

    response = db_client.get("/api/notes")

    assert response.status_code == 200
    assert [note["content"] for note in response.json()] == ["first", "second"]
