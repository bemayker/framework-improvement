"""Router integration tests: full HTTP request/response cycle for
`POST /api/notes` and `GET /api/notes` (`CLAUDE.md` Integration Tests,
`testing_standards.md` Section 1.2)."""


def test_create_note_with_valid_text_returns_201_with_created_note(client):
    """Happy path: 201 with the persisted note, including generated fields."""
    response = client.post("/api/notes", json={"text": "Buy milk"})

    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "Buy milk"
    assert isinstance(body["id"], int)
    assert "created_at" in body


def test_list_notes_after_create_returns_200_containing_it(client):
    """Happy path: a created note is visible in the list."""
    created = client.post("/api/notes", json={"text": "Call the dentist"}).json()

    response = client.get("/api/notes")

    assert response.status_code == 200
    ids = [note["id"] for note in response.json()]
    assert created["id"] in ids


def test_create_note_with_blank_text_returns_422(client):
    """Error case: whitespace-only text is rejected server-side, defence in depth."""
    response = client.post("/api/notes", json={"text": "   "})

    assert response.status_code == 422
    assert response.json() == {"detail": "Note text must not be empty."}


def test_list_notes_on_empty_table_returns_200_with_empty_list(client):
    """Edge case: an empty table returns 200 with an empty list."""
    response = client.get("/api/notes")

    assert response.status_code == 200
    assert response.json() == []
