"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_echo_with_msg_returns_200_with_echoed_text(client: TestClient):
    """Criterion 1: the given text comes back as {"echo": text}."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_validation_error(client: TestClient):
    """Criterion 2: a missing msg is the standard validation 422."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "missing"
    assert detail[0]["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_chars_returns_422(client: TestClient):
    """Criterion 3: 201 characters is rejected by the declared bound."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "string_too_long"
    assert detail[0]["loc"] == ["query", "msg"]


def test_get_echo_with_msg_of_exactly_200_chars_returns_200(client: TestClient):
    """Criterion 3 boundary: 200 characters is still accepted."""
    response = client.get("/api/echo", params={"msg": "a" * 200})

    assert response.status_code == 200
    assert response.json() == {"echo": "a" * 200}


def test_openapi_declares_echo_msg_max_length_200(client: TestClient):
    """Criterion 3: the bound is declared in the schema, not hand-rolled."""
    spec = client.get("/openapi.json").json()

    parameters = spec["paths"]["/api/echo"]["get"]["parameters"]
    msg = next(p for p in parameters if p["name"] == "msg")
    assert msg["required"] is True
    assert msg["schema"]["maxLength"] == 200
