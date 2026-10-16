"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_MSG_LENGTH


def test_get_echo_returns_200_with_the_given_message(client: TestClient):
    """Criterion 1."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_a_url_encoded_message(client: TestClient):
    """Edge case: query-string handling end to end."""
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_201_character_msg_returns_422(client: TestClient):
    """Criterion 3."""
    response = client.get("/api/echo", params={"msg": "a" * (MAX_ECHO_MSG_LENGTH + 1)})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "string_too_long"


def test_get_echo_with_exactly_200_character_msg_returns_200(client: TestClient):
    """Criterion 3 boundary: the bound is inclusive."""
    message = "a" * MAX_ECHO_MSG_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}
