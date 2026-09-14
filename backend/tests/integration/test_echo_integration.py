"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle.

These tests request neither `database_url` nor `db_connection`: the echo
endpoint needs no database, and the suite must stay runnable on a machine with
no PostgreSQL, exactly as test_version_integration.py is.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MESSAGE_MAX_LENGTH


def test_get_echo_returns_200_with_the_message_it_was_given(client: TestClient):
    """Criterion 1: the endpoint echoes its `msg` query parameter."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_round_trips_percent_encoded_text(client: TestClient):
    """Edge case: the value is returned verbatim after URL decoding."""
    response = client.get("/api/echo", params={"msg": "hello world"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422_naming_the_query_parameter(
    client: TestClient,
):
    """Criterion 2: a missing `msg` is the framework's standard 422, not a 500."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["loc"] == ["query", "msg"]
    assert detail[0]["type"] == "missing"


def test_get_echo_accepts_a_message_at_the_maximum_length(client: TestClient):
    """Criterion 3, boundary: the maximum length itself is accepted."""
    message = "a" * ECHO_MESSAGE_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_over_the_maximum_length_returns_422_string_too_long(
    client: TestClient,
):
    """Criterion 3: one character past the bound is rejected by the declared bound."""
    message = "a" * (ECHO_MESSAGE_MAX_LENGTH + 1)

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["loc"] == ["query", "msg"]
    assert detail[0]["type"] == "string_too_long"


def test_openapi_documents_echo_response_as_the_200_schema(client: TestClient):
    """Criterion 4: the 200 body is the EchoResponse pydantic model, not a dict."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    get_operation = schema["paths"]["/api/echo"]["get"]
    content = get_operation["responses"]["200"]["content"]["application/json"]
    assert content["schema"]["$ref"] == "#/components/schemas/EchoResponse"
    assert list(schema["components"]["schemas"]["EchoResponse"]["properties"]) == [
        "echo"
    ]


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """The endpoint is read-only; any other method is FastAPI's 405."""
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
