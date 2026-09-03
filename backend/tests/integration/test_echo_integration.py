"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_with_msg_returns_200_echoing_the_text(client: TestClient):
    """Criterion 1: the endpoint returns the text it was given."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_naming_the_missing_parameter(
    client: TestClient,
):
    """Criterion 2: a missing `msg` is FastAPI's standard validation response."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["loc"] == ["query", "msg"]
    assert detail[0]["type"] == "missing"


def test_get_echo_with_over_long_msg_returns_422_string_too_long(client: TestClient):
    """Criterion 3: one character past the bound is rejected by validation."""
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["loc"] == ["query", "msg"]
    assert detail[0]["type"] == "string_too_long"


def test_get_echo_with_msg_at_the_bound_returns_200(client: TestClient):
    """Boundary edge case: exactly 200 characters is accepted and echoed back."""
    msg = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}


def test_openapi_declares_the_msg_bound_and_the_echo_response_schema(
    client: TestClient,
):
    """Criteria 3 and 4, from the outside: both are declared, not hand-rolled.

    A length check written in the handler would never reach the OpenAPI
    document, and a bare dict response would never produce a component $ref.
    """
    schema = client.get("/openapi.json").json()

    operation = schema["paths"]["/api/echo"]["get"]
    msg_parameter = next(
        parameter
        for parameter in operation["parameters"]
        if parameter["name"] == "msg" and parameter["in"] == "query"
    )
    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == ECHO_MSG_MAX_LENGTH

    response_schema = operation["responses"]["200"]["content"]["application/json"][
        "schema"
    ]
    assert response_schema == {"$ref": "#/components/schemas/EchoResponse"}
    assert "EchoResponse" in schema["components"]["schemas"]


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """The endpoint is read-only, matching the version and health precedents."""
    response = client.post("/api/echo")

    assert response.status_code == 405
