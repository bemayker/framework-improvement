"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle.

Needs no database, exactly like `test_version_integration.py`: this endpoint
touches no persistence layer, so the run's PostgreSQL container is
irrelevant to it.
"""

from fastapi.testclient import TestClient


def test_get_echo_with_msg_returns_200_with_echoed_body(client: TestClient):
    """Criterion 1: the endpoint echoes the given message verbatim."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing `msg` is rejected as 422, not 500 or empty 200."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(
        entry["type"] == "missing" and entry["loc"] == ["query", "msg"]
        for entry in detail
    )


def test_get_echo_with_msg_over_200_chars_returns_422(client: TestClient):
    """Criterion 3: a 201-character `msg` is rejected as 422."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(
        entry["type"] == "string_too_long" and entry["ctx"]["max_length"] == 200
        for entry in detail
    )


def test_get_echo_with_msg_at_200_char_boundary_returns_200(client: TestClient):
    """Boundary edge case: exactly 200 characters is inside the bound."""
    msg = "a" * 200

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}


def test_get_echo_with_empty_msg_returns_200_with_empty_echo(client: TestClient):
    """Edge case: an empty value is present, not missing, so it is valid."""
    response = client.get("/api/echo", params={"msg": ""})

    assert response.status_code == 200
    assert response.json() == {"echo": ""}


def test_post_echo_returns_405_method_not_allowed(client: TestClient):
    """The endpoint accepts no input method other than GET."""
    response = client.post("/api/echo")

    assert response.status_code == 405
