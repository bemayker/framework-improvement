"""Integration tests for GET /api/echo through the full HTTP cycle (TEST-06)."""

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_returns_200_with_the_message(client):
    response = client.get("/api/echo?msg=hello")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_an_encoded_query_string(client):
    response = client.get("/api/echo", params={"msg": "hello world"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_without_msg_returns_422(client):
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "missing"
    assert detail["loc"] == ["query", "msg"]


def test_get_echo_accepts_a_msg_of_exactly_200_characters(client):
    msg = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}


def test_get_echo_with_msg_over_200_characters_returns_422(client):
    msg = "a" * (ECHO_MSG_MAX_LENGTH + 1)

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["type"] == "string_too_long"
    assert detail["loc"] == ["query", "msg"]
