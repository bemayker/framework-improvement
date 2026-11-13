"""Integration tests for GET /api/echo (FEAT-1). Needs no database."""

from fastapi.testclient import TestClient


def test_get_echo_returns_200_with_msg(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_returns_msg_verbatim_with_surrounding_spaces(client: TestClient):
    response = client.get("/api/echo", params={"msg": " hi "})

    assert response.status_code == 200
    assert response.json() == {"echo": " hi "}


def test_get_echo_without_msg_returns_422(client: TestClient):
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_openapi_references_echo_response(client: TestClient):
    spec = client.get("/openapi.json").json()

    schema = spec["paths"]["/api/echo"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert schema["$ref"].endswith("/EchoResponse")
