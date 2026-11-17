"""Integration tests for GET /api/echo (TEST-06).

The endpoint needs no database, so these use only the shared test client.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_returns_200_with_message_echoed(client: TestClient):
    """Happy path: the message comes back under `echo`."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_url_encoded_message(client: TestClient):
    """Edge case: a percent-encoded query string is decoded before echoing."""
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Error case: a missing `msg` is FastAPI's standard 422."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "missing"
    assert detail[0]["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_chars_returns_422(client: TestClient):
    """Error case: a message over the bound is rejected with 422."""
    response = client.get(
        "/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)}
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "string_too_long"
    assert detail[0]["loc"] == ["query", "msg"]


def test_get_echo_with_msg_of_exactly_200_chars_returns_200(client: TestClient):
    """Boundary: a message of exactly the bound is accepted."""
    message = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_openapi_declares_echo_response_schema(client: TestClient):
    """The OpenAPI 200 response references the EchoResponse component."""
    spec = client.get("/openapi.json").json()

    ok_schema = spec["paths"]["/api/echo"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert ok_schema["$ref"] == "#/components/schemas/EchoResponse"
