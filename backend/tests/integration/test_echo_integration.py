"""Integration tests for GET /api/echo (TEST-06); the endpoint needs no database."""

from fastapi.testclient import TestClient

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH


def test_get_echo_returns_200_with_message(client: TestClient):
    """Happy path: the message comes back as {"echo": ...}."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Error: a missing msg is the standard validation response."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_characters_returns_422(client: TestClient):
    """Error: 201 characters is rejected by the schema bound."""
    response = client.get(
        "/api/echo", params={"msg": "a" * (MAX_ECHO_MESSAGE_LENGTH + 1)}
    )

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_of_exactly_200_characters_returns_200(client: TestClient):
    """Boundary: exactly 200 characters is echoed in full."""
    message = "a" * MAX_ECHO_MESSAGE_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_openapi_declares_echo_response_schema(client: TestClient):
    """The 200 response of the route is a $ref to the EchoResponse schema."""
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]

    schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert schema == {"$ref": "#/components/schemas/EchoResponse"}
