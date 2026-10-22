"""Integration tests for whitespace trimming on GET /api/echo (BUG-05)."""

from fastapi.testclient import TestClient

from app.schemas.echo import ECHO_MSG_MAX_LENGTH


def test_get_echo_with_surrounding_whitespace_returns_trimmed_message(client: TestClient):
    response = client.get("/api/echo?msg=%20hi%20")

    assert response.status_code == 200
    assert response.json() == {"echo": "hi"}


def test_get_echo_without_surrounding_whitespace_returns_message_unchanged(client: TestClient):
    response = client.get("/api/echo", params={"msg": "hi"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hi"}


def test_get_echo_keeps_inner_whitespace_while_trimming_the_edges(client: TestClient):
    response = client.get("/api/echo?msg=%20hello%20world%20")

    assert response.status_code == 200
    assert response.json() == {"echo": "hello world"}


def test_get_echo_with_whitespace_only_message_returns_empty_string(client: TestClient):
    response = client.get("/api/echo?msg=%20%20%20")

    assert response.status_code == 200
    assert response.json() == {"echo": ""}


def test_get_echo_applies_max_length_to_the_raw_message_before_trimming(client: TestClient):
    raw_message = " " + "a" * ECHO_MSG_MAX_LENGTH

    response = client.get("/api/echo", params={"msg": raw_message})

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "string_too_long"
