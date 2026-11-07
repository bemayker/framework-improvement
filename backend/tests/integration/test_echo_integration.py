"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle."""

from fastapi.testclient import TestClient


def test_get_echo_with_msg_hello_returns_200_and_echo_body(client: TestClient):
    """Criterion 1."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_decodes_url_encoded_msg(client: TestClient):
    response = client.get("/api/echo", params={"msg": "a&b=c d"})

    assert response.status_code == 200
    assert response.json() == {"echo": "a&b=c d"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"] == ["query", "msg"]
    assert detail["type"] == "missing"


def test_get_echo_with_201_char_msg_returns_422(client: TestClient):
    """Criterion 3."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    detail = response.json()["detail"][0]
    assert detail["loc"] == ["query", "msg"]
    assert detail["type"] == "string_too_long"


def test_get_echo_with_200_char_msg_returns_200(client: TestClient):
    """Criterion 3 boundary: exactly 200 characters is accepted."""
    response = client.get("/api/echo", params={"msg": "a" * 200})

    assert response.status_code == 200
    assert response.json() == {"echo": "a" * 200}


def test_get_echo_with_empty_msg_returns_200_and_empty_echo(client: TestClient):
    response = client.get("/api/echo", params={"msg": ""})

    assert response.status_code == 200
    assert response.json() == {"echo": ""}


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/echo")

    assert response.status_code == 405
