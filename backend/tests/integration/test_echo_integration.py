"""Router integration tests for GET /api/echo (TEST-06).

No database is needed; the tests go through the real HTTP request cycle only.
"""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_with_msg_returns_200_and_echo_body(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422_missing(client: TestClient):
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["type"] == "missing"
    assert detail[0]["loc"][-1] == "msg"


def test_get_echo_over_max_length_returns_422_string_too_long(client: TestClient):
    response = client.get("/api/echo", params={"msg": "a" * (ECHO_MSG_MAX_LENGTH + 1)})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "string_too_long"


def test_get_echo_at_exactly_max_length_returns_200(client: TestClient):
    msg = "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}


def test_get_echo_decodes_url_encoded_msg(client: TestClient):
    response = client.get("/api/echo?msg=hello%20world%26more")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world&more"}


def test_post_echo_returns_405(client: TestClient):
    response = client.post("/api/echo", params={"msg": "hello"})

    assert response.status_code == 405
