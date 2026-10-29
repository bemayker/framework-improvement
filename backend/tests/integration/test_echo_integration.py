"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH


def test_get_echo_with_msg_returns_200_and_echo(client: TestClient):
    """Criterion 1: the given text comes back as {"echo": text}."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard 422, not a 500 or empty 200."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_max_length_msg_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is accepted and echoed unchanged."""
    message = "a" * MAX_ECHO_MESSAGE_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_with_msg_over_max_length_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected by the declared bound."""
    response = client.get("/api/echo", params={"msg": "a" * (MAX_ECHO_MESSAGE_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]
    assert detail["ctx"]["max_length"] == MAX_ECHO_MESSAGE_LENGTH
