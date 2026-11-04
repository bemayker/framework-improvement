"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_echo_returns_200_with_echoed_msg(client: TestClient):
    """Criterion 1: msg=hello is echoed back exactly."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_url_encoded_space(client: TestClient):
    """Query-string handling end to end: %20 arrives as a space."""
    response = client.get("/api/echo?msg=hello%20world")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422_missing(client: TestClient):
    """Criterion 2: a missing msg is FastAPI's standard 422."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"] == ["query", "msg"]
    assert detail["type"] == "missing"


def test_get_echo_with_200_characters_is_accepted(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is still valid."""
    msg = "a" * 200

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}


def test_get_echo_with_201_characters_returns_422_string_too_long(client: TestClient):
    """Criterion 3: one character over the bound is a 422."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "string_too_long"


def test_openapi_declares_msg_bound_and_echo_response_schema(client: TestClient):
    """Criteria 3 and 4: the bound and the body are declared, not hand-rolled."""
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]

    msg_param = next(p for p in operation["parameters"] if p["name"] == "msg")
    assert msg_param["required"] is True
    assert msg_param["schema"]["maxLength"] == 200
    ok_schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert ok_schema["$ref"].endswith("/EchoResponse")


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/echo")

    assert response.status_code == 405
