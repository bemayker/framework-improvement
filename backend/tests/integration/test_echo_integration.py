"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_LENGTH, EchoResponse


def test_get_echo_with_msg_returns_200_and_echoed_body(client: TestClient):
    """Criterion 1: the given text comes back as {"echo": ...}."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_missing(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard 422."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_201_characters_returns_422_string_too_long(client: TestClient):
    """Criterion 3: one character over the bound is rejected."""
    response = client.get("/api/echo", params={"msg": "a" * (MAX_ECHO_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_exactly_200_characters_returns_200(client: TestClient):
    """Boundary: exactly the bound is accepted and echoed."""
    message = "a" * MAX_ECHO_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_round_trips_spaces_and_ampersand(client: TestClient):
    """Query-string handling: URL-encoded characters come back decoded and unchanged."""
    message = "hello world & more"

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_body_matches_echo_response_schema(client: TestClient):
    """Criterion 4: the body validates against the EchoResponse schema."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert EchoResponse.model_validate(response.json()).echo == "hello"
