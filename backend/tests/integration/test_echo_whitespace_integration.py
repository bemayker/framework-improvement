"""Router integration tests for GET /api/echo whitespace trimming (BUG-05)."""

from fastapi.testclient import TestClient


def test_get_echo_trims_surrounding_whitespace(client: TestClient):
    response = client.get("/api/echo?msg=%20hi%20")

    assert response.status_code == 200
    assert response.json() == {"echo": "hi"}


def test_get_echo_keeps_inner_whitespace_unchanged(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello world"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}
