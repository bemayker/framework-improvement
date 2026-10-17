"""Integration tests for GET /api/echo (TEST-06). No database is involved."""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MESSAGE_MAX_LENGTH


def test_get_echo_returns_200_with_the_given_message(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_missing(client: TestClient):
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_with_message_over_max_length_returns_422(client: TestClient):
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MESSAGE_MAX_LENGTH + 1)})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "string_too_long"


def test_get_echo_with_message_at_max_length_returns_200(client: TestClient):
    message = "a" * ECHO_MESSAGE_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_openapi_declares_msg_max_length(client: TestClient):
    parameters = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]["parameters"]

    msg_parameter = next(p for p in parameters if p["name"] == "msg")

    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == ECHO_MESSAGE_MAX_LENGTH
