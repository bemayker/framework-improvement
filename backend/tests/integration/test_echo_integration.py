"""Integration tests for GET /api/echo (FEAT-1), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_echo_returns_200_with_msg_echoed(client: TestClient):
    """Criterion 5: the message comes back as {"echo": msg}."""
    response = client.get("/api/echo", params={"msg": "hello world"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_returns_msg_verbatim_with_special_characters(client: TestClient):
    """URL-encoded special characters and edge whitespace survive unchanged."""
    message = " a&b=c d/é? "

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """msg is required: FastAPI's own validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
