"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_with_msg_returns_200_and_echoes_text(client: TestClient):
    """Criterion 1: the given text comes back in the echo field."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_url_encoded_msg(client: TestClient):
    """Criterion 1 edge case: a URL-encoded value is returned decoded."""
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422_validation_error(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_chars_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected by the declared bound."""
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_of_200_chars_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is accepted."""
    text = "a" * ECHO_MSG_MAX_LENGTH
    response = client.get("/api/echo", params={"msg": text})

    assert response.status_code == 200
    assert response.json() == {"echo": text}


def test_openapi_declares_msg_max_length_200(client: TestClient):
    """Criterion 3: the bound is declared on the parameter, so OpenAPI advertises it."""
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]
    msg_param = next(p for p in operation["parameters"] if p["name"] == "msg")

    assert msg_param["required"] is True
    assert msg_param["schema"]["maxLength"] == 200


def test_openapi_declares_echo_response_schema(client: TestClient):
    """Criterion 4: the 200 response references the EchoResponse Pydantic schema."""
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]
    schema = operation["responses"]["200"]["content"]["application/json"]["schema"]

    assert schema == {"$ref": "#/components/schemas/EchoResponse"}
