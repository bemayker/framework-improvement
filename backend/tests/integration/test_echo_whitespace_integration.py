"""Integration tests for whitespace handling in GET /api/echo (BUG-05). No database is involved."""

from fastapi.testclient import TestClient


def test_get_echo_strips_surrounding_whitespace(client: TestClient):
    response = client.get("/api/echo", params={"msg": " hi "})

    assert response.status_code == 200
    assert response.json() == {"echo": "hi"}


def test_get_echo_without_surrounding_whitespace_returns_message_unchanged(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello world"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}
