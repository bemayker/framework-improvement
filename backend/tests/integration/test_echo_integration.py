"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def _detail_locations(response) -> list[list]:
    return [entry["loc"] for entry in response.json()["detail"]]


def test_get_echo_with_msg_returns_200_and_echo_body(client: TestClient):
    """Criteria 1 and 4: the msg comes back in the schema-defined body."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    assert ["query", "msg"] in _detail_locations(response)


def test_get_echo_with_msg_over_200_chars_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected, naming msg."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    assert ["query", "msg"] in _detail_locations(response)


def test_get_echo_with_msg_of_exactly_200_chars_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is accepted and echoed."""
    response = client.get("/api/echo", params={"msg": "a" * 200})

    assert response.status_code == 200
    assert response.json() == {"echo": "a" * 200}
