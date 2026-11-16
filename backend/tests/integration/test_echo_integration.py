"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_returns_200_with_echoed_msg(client: TestClient):
    """Criterion 1: the endpoint returns the text it was given."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: an absent msg is a standard validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    first_error = response.json()["detail"][0]
    assert first_error["type"] == "missing"
    assert first_error["loc"] == ["query", "msg"]


def test_get_echo_with_msg_longer_than_200_chars_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected by the schema bound."""
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    first_error = response.json()["detail"][0]
    assert first_error["type"] == "string_too_long"
    assert first_error["loc"] == ["query", "msg"]


def test_get_echo_with_msg_of_exactly_200_chars_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is accepted."""
    msg = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}
