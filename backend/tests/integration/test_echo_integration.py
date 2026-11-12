"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_echo_returns_200_with_echoed_message(client: TestClient):
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


def test_get_echo_with_msg_of_200_characters_returns_200(client: TestClient):
    message = "a" * 200

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_openapi_documents_echo_response_schema(client: TestClient):
    document = client.get("/openapi.json").json()

    ok_schema = document["paths"]["/api/echo"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert ok_schema == {"$ref": "#/components/schemas/EchoResponse"}
