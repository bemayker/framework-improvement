"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_echo_returns_200_with_msg_echoed(client: TestClient):
    """Criterion 1: the msg comes back in the echo field."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_round_trips_url_encoded_msg(client: TestClient):
    """Criterion 1: an encoded value is decoded once and returned as typed."""
    response = client.get("/api/echo?msg=hello%20world%20%26%20more")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world & more"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard validation error."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_chars_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected with the standard detail shape."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]
    assert detail["ctx"] == {"max_length": 200}


def test_get_echo_with_msg_of_exactly_200_chars_returns_200(client: TestClient):
    """Criterion 3 edge: the bound is inclusive."""
    message = "a" * 200

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_openapi_response_schema_is_echo_response(client: TestClient):
    """Criterion 4: the 200 response is the EchoResponse component schema."""
    spec = client.get("/openapi.json").json()

    ok_schema = spec["paths"]["/api/echo"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert ok_schema == {"$ref": "#/components/schemas/EchoResponse"}
