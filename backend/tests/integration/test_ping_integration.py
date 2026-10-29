"""Integration tests for GET /api/ping (FEAT-10), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_ping_returns_200_with_status_ok(client: TestClient):
    """Criterion 1: the endpoint answers 200 with exactly {"status": "ok"}."""
    response = client.get("/api/ping")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_ping_answers_when_database_url_is_unset(monkeypatch):
    """No database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/ping")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_post_ping_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/ping")

    assert response.status_code == 405
