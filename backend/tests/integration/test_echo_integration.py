"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MESSAGE_MAX_LENGTH


def test_get_echo_returns_200_with_echoed_message(client: TestClient):
    """Criterion 1: the message comes back wrapped in the echo body."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_url_encoded_space(client: TestClient):
    """Edge case: an encoded space is decoded end to end."""
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422_missing(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_over_max_length_returns_422_string_too_long(client: TestClient):
    """Criterion 3: one character over the bound is rejected."""
    response = client.get(
        "/api/echo", params={"msg": "a" * (ECHO_MESSAGE_MAX_LENGTH + 1)}
    )

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]
    assert detail["ctx"]["max_length"] == ECHO_MESSAGE_MAX_LENGTH


def test_get_echo_at_max_length_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly the bound is accepted and echoed."""
    message = "a" * ECHO_MESSAGE_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_openapi_declares_bound_and_response_schema(client: TestClient):
    """Criteria 3 and 4: the bound and the response schema are declared."""
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]

    msg_parameter = next(p for p in operation["parameters"] if p["name"] == "msg")
    assert msg_parameter["schema"]["maxLength"] == ECHO_MESSAGE_MAX_LENGTH
    assert msg_parameter["required"] is True
    ok_schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert ok_schema["$ref"].endswith("/EchoResponse")


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/echo")

    assert response.status_code == 405
