"""Integration tests for GET /api/echo (TEST-06). No database is touched."""

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_returns_200_with_the_message(client):
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_the_query_string(client):
    response = client.get("/api/echo", params={"msg": "hello world & more"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world & more"}


def test_get_echo_without_msg_returns_422(client):
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_accepts_msg_of_exactly_200_characters(client):
    message = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_with_msg_over_200_characters_returns_422(client):
    response = client.get(
        "/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)}
    )

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["ctx"]["max_length"] == ECHO_MSG_MAX_LENGTH


def test_openapi_declares_msg_max_length_and_echo_response_schema(client):
    operation = client.get("/openapi.json").json()["paths"]["/api/echo"]["get"]

    msg_parameter = next(p for p in operation["parameters"] if p["name"] == "msg")
    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == ECHO_MSG_MAX_LENGTH
    ok_schema = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert ok_schema["$ref"] == "#/components/schemas/EchoResponse"


def test_post_echo_returns_405_method_not_allowed(client):
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
