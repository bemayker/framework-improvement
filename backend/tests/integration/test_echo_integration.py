"""Integration tests for GET /api/echo (TEST-06).

The endpoint touches no data, so no database fixture is used.
"""

from fastapi.testclient import TestClient


def test_get_echo_with_msg_returns_200_with_echoed_text(client: TestClient):
    """Criterion 1: the given msg comes back as {"echo": msg}."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard 422."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["type"] == "missing"
    assert error["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_characters_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected with string_too_long."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["type"] == "string_too_long"
    assert error["loc"] == ["query", "msg"]


def test_get_echo_with_msg_of_exactly_200_characters_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is echoed back."""
    msg = "a" * 200

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}


def test_get_echo_openapi_response_schema_is_echo_response(client: TestClient):
    """Criterion 4: the OpenAPI 200 response references EchoResponse."""
    document = client.get("/openapi.json").json()

    schema = document["paths"]["/api/echo"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert schema["$ref"] == "#/components/schemas/EchoResponse"
