"""Router integration tests for GET /api/echo (TEST-06).

The endpoint touches no database, so only the session `client` fixture is used.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_returns_200_with_message(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"] == ["query", "msg"]
    assert detail["type"] == "missing"


def test_get_echo_with_201_characters_returns_422(client: TestClient):
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "string_too_long"


def test_get_echo_with_exactly_200_characters_returns_200(client: TestClient):
    message = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_get_echo_returns_url_decoded_message(client: TestClient):
    message = "hello world & more"

    response = client.get("/api/echo", params={"msg": message})

    assert response.status_code == 200
    assert response.json() == {"echo": message}


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
