"""Integration tests for the notes slice (TEST-03).

Repository tests run real SQL against the PostgreSQL from docker-compose.yml;
router tests drive the full HTTP request/response cycle on the same session.
Both roll back afterwards (see backend/tests/conftest.py).
"""

from sqlalchemy.orm import Session

from app.repositories.note_repository import NoteRepository

REPOSITORY = NoteRepository()


def test_add_then_list_all_returns_the_stored_note(db_session: Session):
    """Repository happy path: an inserted note round-trips out of the database."""
    stored = REPOSITORY.add(db_session, "Buy milk")

    assert stored.id is not None
    assert stored.created_at is not None

    notes = REPOSITORY.list_all(db_session)

    assert [(note.id, note.text) for note in notes] == [(stored.id, "Buy milk")]


def test_list_all_returns_notes_in_insertion_order(db_session: Session):
    """Repository ordering: oldest first, which the frontend renders top-down."""
    REPOSITORY.add(db_session, "first")
    REPOSITORY.add(db_session, "second")
    REPOSITORY.add(db_session, "third")

    assert [note.text for note in REPOSITORY.list_all(db_session)] == [
        "first",
        "second",
        "third",
    ]


def test_list_all_returns_empty_list_when_no_notes_exist(db_session: Session):
    """Repository edge case: an empty table yields an empty list."""
    assert REPOSITORY.list_all(db_session) == []


def test_post_notes_creates_the_note_and_returns_201(db_client):
    """Router happy path (AC1): the stored note comes back with id and timestamp."""
    response = db_client.post("/api/notes", json={"text": "Buy milk"})

    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "Buy milk"
    assert isinstance(body["id"], int)
    assert body["created_at"]


def test_post_notes_trims_the_submitted_text(db_client):
    """Router edge case: padding is stripped server-side, per the API contract."""
    response = db_client.post("/api/notes", json={"text": "  Walk the dog  "})

    assert response.status_code == 201
    assert response.json()["text"] == "Walk the dog"


def test_post_notes_with_empty_text_returns_422(db_client):
    """Router error case (AC2, defence in depth): blank text is rejected."""
    response = db_client.post("/api/notes", json={"text": ""})

    assert response.status_code == 422
    assert response.json() == {"detail": "Note text must not be empty."}
    assert db_client.get("/api/notes").json() == []


def test_post_notes_with_whitespace_only_text_returns_422(db_client):
    """Router error case: whitespace-only counts as empty."""
    response = db_client.post("/api/notes", json={"text": "   "})

    assert response.status_code == 422
    assert response.json() == {"detail": "Note text must not be empty."}


def test_post_notes_without_text_field_returns_422(db_client):
    """Router error case: FastAPI's own validation covers the missing field."""
    response = db_client.post("/api/notes", json={})

    assert response.status_code == 422


def test_get_notes_returns_every_stored_note_oldest_first(db_client):
    """Router happy path (AC3): the list endpoint serves what was persisted."""
    db_client.post("/api/notes", json={"text": "first"})
    db_client.post("/api/notes", json={"text": "second"})

    response = db_client.get("/api/notes")

    assert response.status_code == 200
    assert [note["text"] for note in response.json()] == ["first", "second"]


def test_get_notes_returns_empty_array_when_no_notes_exist(db_client):
    """Router edge case: an empty store is an empty array, not a 404."""
    response = db_client.get("/api/notes")

    assert response.status_code == 200
    assert response.json() == []
