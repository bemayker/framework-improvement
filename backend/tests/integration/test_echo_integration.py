"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle.

The endpoint needs no database, so no test here requests `database_url`.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_returns_200_with_the_given_message(client: TestClient):
    """Criterion 1: the message comes back in the echo field."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_missing(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation response."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "missing"
    assert detail[0]["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_the_bound_returns_422_too_long(client: TestClient):
    """Criterion 3: one character over the bound is rejected."""
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "string_too_long"
    assert detail[0]["loc"] == ["query", "msg"]
    assert detail[0]["ctx"] == {"max_length": ECHO_MSG_MAX_LENGTH}


def test_get_echo_with_msg_at_the_bound_returns_200(client: TestClient):
    """Criterion 3 edge case: the bound is inclusive at exactly 200 characters."""
    message = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_decodes_a_url_encoded_inner_space(client: TestClient):
    """Query-string handling end to end: %20 is decoded and echoed back."""
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_openapi_declares_msg_bound_and_echo_response_schema(client: TestClient):
    """Criteria 3 and 4: the bound and the Pydantic response model are published."""
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]

    (msg_parameter,) = operation["parameters"]
    assert msg_parameter["name"] == "msg"
    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == ECHO_MSG_MAX_LENGTH
    ok_schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert ok_schema == {"$ref": "#/components/schemas/EchoResponse"}


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """The endpoint is read-only."""
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
