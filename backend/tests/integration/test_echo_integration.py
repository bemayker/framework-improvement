"""Integration tests for GET /api/echo (TEST-06, TEST-11), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH


def test_get_echo_returns_200_with_message_round_trip(client: TestClient):
    """Criterion 1: the given text comes back in the echo field."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is a validation error, not a 500 or empty 200."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["query", "msg"]


def test_get_echo_over_max_length_returns_422(client: TestClient):
    """Criterion 3: one character past the bound is rejected."""
    response = client.get(
        "/api/echo", params={"msg": "a" * (MAX_ECHO_MESSAGE_LENGTH + 1)}
    )

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_at_exactly_max_length_returns_200(client: TestClient):
    """Edge case: the bound is inclusive."""
    message = "a" * MAX_ECHO_MESSAGE_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_url_encoded_value_with_space_round_trips(client: TestClient):
    """Edge case: query-string decoding gives the text back exactly as sent."""
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_with_surrounding_spaces_returns_trimmed_message(client: TestClient):
    """Criterion 1: surrounding spaces are removed from the echo."""
    response = client.get("/api/echo?msg=%20%20hello%20%20")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_with_only_whitespace_returns_empty_echo(client: TestClient):
    """Criterion 2: a whitespace-only message echoes the empty string."""
    response = client.get("/api/echo?msg=%20%20%20")

    assert response.status_code == 200
    assert response.json() == {"echo": ""}


def test_get_echo_over_max_length_before_trimming_returns_422(client: TestClient):
    """Criterion 3: 201 characters as sent is rejected though 199 remain after trimming."""
    message = " " + "a" * (MAX_ECHO_MESSAGE_LENGTH - 1) + " "

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_at_max_length_with_padding_returns_trimmed_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters as sent is accepted, then trimmed."""
    core = "a" * (MAX_ECHO_MESSAGE_LENGTH - 4)

    response = client.get("/api/echo", params={"msg": "  " + core + "  "})

    assert response.status_code == 200
    assert response.json() == {"echo": core}


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is GET only."""
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
