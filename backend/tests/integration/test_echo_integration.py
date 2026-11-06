"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle.

The endpoint needs no database, so no test here requests `database_url`.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_returns_200_with_message(client: TestClient):
    """Criterion 1: the message comes back in the echo field."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_naming_query_msg(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation response."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "missing"
    assert detail[0]["loc"] == ["query", "msg"]


def test_get_echo_with_exactly_max_length_returns_200(client: TestClient):
    """Edge case: the bound is inclusive, 200 characters are accepted."""
    message = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_over_max_length_returns_422_string_too_long(client: TestClient):
    """Criterion 3: 201 characters are rejected with the declared bound."""
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "string_too_long"
    assert detail[0]["loc"] == ["query", "msg"]
    assert detail[0]["ctx"] == {"max_length": ECHO_MSG_MAX_LENGTH}


def test_get_echo_returns_url_encoded_message_verbatim(client: TestClient):
    """Edge case: the decoded message, spaces and punctuation included, is unchanged."""
    response = client.get("/api/echo?msg=hello%20world%21")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world!"}


def test_openapi_declares_msg_required_with_max_length(client: TestClient):
    """Criterion 3: the bound is published in the OpenAPI document."""
    schema = client.get("/openapi.json").json()

    parameters = schema["paths"]["/api/echo"]["get"]["parameters"]
    msg = next(p for p in parameters if p["name"] == "msg")
    assert msg["in"] == "query"
    assert msg["required"] is True
    assert msg["schema"]["maxLength"] == ECHO_MSG_MAX_LENGTH


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
