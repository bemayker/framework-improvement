"""Integration tests for GET /api/echo (TEST-06), full HTTP request/response cycle.

No database fixture is used: the endpoint touches no database and must
answer with DATABASE_URL unset, exactly as GET /api/version does.
"""

from fastapi.testclient import TestClient


def test_get_echo_with_msg_returns_200_with_echoed_value(client: TestClient):
    """Criterion 1: the endpoint echoes the msg query parameter back."""
    response = client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}


def test_get_echo_without_msg_returns_422(client: TestClient):
    """Criterion 2: a missing msg is a validation error, not a 500 or empty 200."""
    response = client.get("/api/echo")

    assert response.status_code == 422
    assert "detail" in response.json()


def test_get_echo_with_msg_over_200_characters_returns_422(client: TestClient):
    """Criterion 3: 201 characters is over the declared bound."""
    response = client.get("/api/echo", params={"msg": "a" * 201})

    assert response.status_code == 422
    assert "detail" in response.json()


def test_get_echo_with_msg_of_exactly_200_characters_returns_200(client: TestClient):
    """Edge case: the 200-character boundary is inclusive."""
    msg = "a" * 200

    response = client.get("/api/echo", params={"msg": msg})

    assert response.status_code == 200
    assert response.json() == {"echo": msg}


def test_get_echo_answers_when_database_url_is_unset(monkeypatch):
    """No database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    from app.main import create_app

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/echo", params={"msg": "hello"})

    assert response.status_code == 200
    assert response.json() == {"echo": "hello"}
