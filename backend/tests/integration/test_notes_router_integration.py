"""Integration tests for the notes endpoints (TEST-03), full HTTP cycle.

The client runs on the rolled-back session from conftest.api_client, so these
requests hit real PostgreSQL and leave nothing behind.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.note import MAX_NOTE_LENGTH, Note


def _clear_notes(session: Session) -> None:
    session.execute(delete(Note))


def test_post_notes_returns_201_with_the_created_note(
    api_client: TestClient, db_session: Session
):
    """Criterion 1: a non-empty note is stored and returned as saved."""
    _clear_notes(db_session)

    response = api_client.post("/api/notes", json={"text": "  Buy milk  "})

    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "Buy milk"
    assert isinstance(body["id"], int)
    assert body["created_at"]


def test_get_notes_returns_200_with_previously_created_notes_newest_first(
    api_client: TestClient, db_session: Session
):
    """Criterion 3: saved notes are read back from the database, newest first."""
    _clear_notes(db_session)
    api_client.post("/api/notes", json={"text": "Buy milk"})
    api_client.post("/api/notes", json={"text": "Call the dentist"})

    response = api_client.get("/api/notes")

    assert response.status_code == 200
    assert [note["text"] for note in response.json()] == [
        "Call the dentist",
        "Buy milk",
    ]


def test_get_notes_returns_empty_list_when_none_exist(
    api_client: TestClient, db_session: Session
):
    """Edge case: the endpoint answers 200 with [] rather than 404."""
    _clear_notes(db_session)

    response = api_client.get("/api/notes")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize("blank_text", ["", "   "])
def test_post_notes_with_blank_text_returns_422_and_stores_nothing(
    api_client: TestClient, db_session: Session, blank_text: str
):
    """Validation error: blank text is rejected with the contract's message."""
    _clear_notes(db_session)

    response = api_client.post("/api/notes", json={"text": blank_text})

    assert response.status_code == 422
    assert response.json() == {"detail": "Note text must not be empty."}
    assert api_client.get("/api/notes").json() == []


def test_post_notes_with_over_long_text_returns_422(
    api_client: TestClient, db_session: Session
):
    """Boundary: text beyond the column's length is rejected before storage."""
    _clear_notes(db_session)

    response = api_client.post(
        "/api/notes", json={"text": "a" * (MAX_NOTE_LENGTH + 1)}
    )

    assert response.status_code == 422
    assert api_client.get("/api/notes").json() == []
