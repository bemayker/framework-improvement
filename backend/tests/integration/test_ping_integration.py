"""Integration tests for GET /api/ping (TEST-13), full HTTP request/response cycle.

No database fixture: the endpoint touches no database.
"""

from fastapi.testclient import TestClient


def test_get_ping_returns_200_with_boolean_pong_true(client: TestClient):
    """Criterion 1: 200 and exactly {"pong": true}, a boolean and not "true"."""
    response = client.get("/api/ping")

    assert response.status_code == 200
    body = response.json()
    assert body == {"pong": True}
    assert body["pong"] is True


def test_get_ping_responds_with_json_content_type(client: TestClient):
    """Happy path: the body is served as JSON."""
    response = client.get("/api/ping")

    assert response.headers["content-type"].startswith("application/json")


def test_openapi_lists_ping_get_operation_with_typed_response(client: TestClient):
    """Criterion 2: /openapi.json lists the endpoint and its typed response."""
    schema = client.get("/openapi.json").json()

    operation = schema["paths"]["/api/ping"]["get"]
    ok_schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert ok_schema["$ref"].endswith("/PingResponse")
    ping_response = schema["components"]["schemas"]["PingResponse"]
    assert ping_response["properties"]["pong"]["type"] == "boolean"
    assert "pong" in ping_response["required"]


def test_post_ping_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is GET only."""
    response = client.post("/api/ping")

    assert response.status_code == 405
