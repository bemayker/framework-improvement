"""Integration tests for GET /api/echo through the HTTP cycle (TEST-06).

No database is involved, so these tests do not use the database fixtures.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH


def test_get_echo_returns_message_in_body(client: TestClient):
    """Criterion 1: ?msg=hello returns 200 with exactly {"echo": "hello"}."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_missing(client: TestClient):
    """Criterion 2: no msg returns FastAPI's standard 422, not 500 or 200."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_over_max_length_returns_422(client: TestClient):
    """Criterion 3: 201 characters returns 422 string_too_long."""
    response = client.get(
        "/api/echo", params={"msg": "a" * (MAX_ECHO_MESSAGE_LENGTH + 1)}
    )

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_at_exactly_max_length_returns_200(client: TestClient):
    """Boundary: exactly 200 characters is valid and echoed back."""
    message = "a" * MAX_ECHO_MESSAGE_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_with_empty_msg_returns_200_empty_echo(client: TestClient):
    """Assumption: a present but empty msg is valid and echoes an empty string."""
    response = client.get("/api/echo", params={"msg": ""})

    assert response.status_code == 200
    assert response.json() == {"echo": ""}


def test_openapi_references_echo_response_schema(client: TestClient):
    """Criterion 4: the 200 response is defined by the EchoResponse schema."""
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]

    schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert schema == {"$ref": "#/components/schemas/EchoResponse"}


def test_post_echo_returns_405(client: TestClient):
    """Error case: only GET is allowed on /api/echo."""
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
