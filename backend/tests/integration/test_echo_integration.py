"""Integration tests for GET /api/echo (FEAT-1), full HTTP cycle."""

from fastapi.testclient import TestClient


def test_get_echo_returns_msg_verbatim(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_keeps_spaces_in_msg(client: TestClient):
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    assert client.get("/api/echo").status_code == 422


def test_post_echo_returns_405(client: TestClient):
    assert client.post("/api/echo").status_code == 405
