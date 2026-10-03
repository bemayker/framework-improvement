"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle.

The endpoint uses no database, so these tests need no DATABASE_URL.
"""

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_with_msg_returns_200_and_echo(client: TestClient):
    """Criterion 1: the given text comes back as {"echo": ...}."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_limit_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected by the schema-declared bound."""
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_at_limit_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is accepted."""
    message = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_round_trips_url_encoded_text(client: TestClient):
    """Query-string decoding works end to end."""
    message = "hello world & more"

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_with_surrounding_spaces_returns_trimmed_echo(client: TestClient):
    """TEST-11 criterion 1: surrounding whitespace is removed."""
    response = client.get("/api/echo", params={"msg": "  hello  "})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_with_whitespace_only_returns_empty_echo(client: TestClient):
    """TEST-11 criterion 2: a whitespace-only message echoes as an empty string."""
    response = client.get("/api/echo", params={"msg": "   "})

    assert response.status_code == 200
    assert response.json() == {"echo": ""}


def test_get_echo_over_limit_as_sent_returns_422_even_if_trimmed_fits(client: TestClient):
    """TEST-11 criterion 3: 201 characters as sent is rejected before trimming."""
    message = " " + "a" * (ECHO_MSG_MAX_LENGTH - 1) + " "

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_at_limit_as_sent_returns_trimmed_echo(client: TestClient):
    """TEST-11 criterion 3 boundary: 200 characters as sent is accepted, then trimmed."""
    message = " " + "a" * (ECHO_MSG_MAX_LENGTH - 2) + " "

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": "a" * (ECHO_MSG_MAX_LENGTH - 2)}


def test_echo_openapi_response_schema_is_echo_response():
    """Criterion 4: the 200 response is defined by the EchoResponse schema."""
    schema = create_app().openapi()

    ok_schema = schema["paths"]["/api/echo"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]

    assert ok_schema == {"$ref": "#/components/schemas/EchoResponse"}
