"""Integration tests for GET /api/echo (TEST-06): the real HTTP cycle."""

from fastapi.testclient import TestClient


def test_get_echo_returns_200_with_message(client: TestClient):
    """Happy path: the message is echoed back."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Error case: a missing msg is the standard validation response."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_201_characters_returns_422(client: TestClient):
    """Error case: over the bound is rejected with string_too_long."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_200_characters_returns_200(client: TestClient):
    """Boundary: exactly 200 characters is accepted and echoed."""
    message = "a" * 200

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_openapi_declares_echo_response_schema(client: TestClient):
    """The 200 response of GET /api/echo references the EchoResponse schema."""
    document = client.get("/openapi.json").json()

    schema = document["paths"]["/api/echo"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]

    assert schema["$ref"] == "#/components/schemas/EchoResponse"
