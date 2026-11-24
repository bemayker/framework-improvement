"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_MSG_LENGTH


def test_get_echo_returns_200_with_given_message(client: TestClient):
    """Criterion 1: the endpoint returns the message under the echo key."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "missing"
    assert detail[0]["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_chars_returns_422(client: TestClient):
    """Criterion 3: a msg one character over the bound is rejected."""
    response = client.get("/api/echo", params={"msg": "a" * (MAX_ECHO_MSG_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "string_too_long"
    assert detail[0]["ctx"] == {"max_length": MAX_ECHO_MSG_LENGTH}


def test_get_echo_with_msg_of_exactly_200_chars_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is accepted."""
    message = "a" * MAX_ECHO_MSG_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}
