"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_echo_returns_200_with_given_message(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_over_200_characters_returns_422(client: TestClient):
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_msg_of_exactly_200_characters_returns_200(client: TestClient):
    message = "a" * 200

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_response_schema_is_echo_response(client: TestClient):
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]

    ok_schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert ok_schema["$ref"] == "#/components/schemas/EchoResponse"
    msg_parameter = next(p for p in operation["parameters"] if p["name"] == "msg")
    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == 200
