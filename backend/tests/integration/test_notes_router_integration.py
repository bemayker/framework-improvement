"""Integration tests for the notes router, through the full HTTP cycle.

Isolation is per-test transaction rollback via the `db_session`-backed
`client` fixture (`backend/tests/conftest.py`).
"""

from fastapi.testclient import TestClient


def test_post_notes_with_valid_content_returns_201_with_created_note(client: TestClient):
    """Happy path: POST /api/notes stores the note and returns it, 201."""
    response = client.post("/api/notes", json={"content": "Buy milk"})

    assert response.status_code == 201
    body = response.json()
    assert body["content"] == "Buy milk"
    assert "id" in body
    assert "created_at" in body


def test_get_notes_returns_200_with_previously_created_notes(client: TestClient):
    """Happy path: GET /api/notes returns notes created earlier in the same test."""
    client.post("/api/notes", json={"content": "Buy milk"})
    client.post("/api/notes", json={"content": "Call the dentist"})

    response = client.get("/api/notes")

    assert response.status_code == 200
    contents = [note["content"] for note in response.json()]
    assert contents == ["Buy milk", "Call the dentist"]


def test_get_notes_returns_200_with_empty_list_when_none_exist(client: TestClient):
    """Edge case: no notes yet yields an empty array, not an error."""
    response = client.get("/api/notes")

    assert response.status_code == 200
    assert response.json() == []


def test_post_notes_with_whitespace_only_content_returns_400(client: TestClient):
    """Error case: whitespace-only content is rejected with 400 and a detail message."""
    response = client.post("/api/notes", json={"content": "   "})

    assert response.status_code == 400
    assert response.json() == {"detail": "Note content must not be empty."}


def test_post_notes_with_missing_content_returns_422(client: TestClient):
    """Error case: a missing `content` field is a pydantic validation error, 422."""
    response = client.post("/api/notes", json={})

    assert response.status_code == 422
