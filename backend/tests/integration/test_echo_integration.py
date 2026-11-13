"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle.

No database is touched: the endpoint has no persistence.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_LENGTH


def test_get_echo_with_msg_returns_200_with_echoed_text(client: TestClient):
    """Criterion 1: the message comes back verbatim in the body."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is a validation error, not a 500 or empty 200."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_201_character_msg_returns_422(client: TestClient):
    """Criterion 3: one character over the bound is rejected."""
    response = client.get("/api/echo", params={"msg": "a" * (MAX_ECHO_LENGTH + 1)})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "string_too_long"


def test_get_echo_with_200_character_msg_returns_200(client: TestClient):
    """Edge case: exactly the bound is accepted and echoed in full."""
    msg = "a" * MAX_ECHO_LENGTH

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}
