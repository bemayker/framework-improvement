"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Happy path: exactly the keys now and timezone; now is UTC-aware."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)
    assert body["now"].endswith("+00:00")


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response forbids shared caches from storing it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
