"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """FEAT-1: 200 with exactly the keys now and timezone, timezone is UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """BUG-01 criteria 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_now_is_aware_utc(client: TestClient):
    """FEAT-1: now parses as ISO 8601, timezone-aware, zero offset (Z or +00:00)."""
    body = client.get("/api/time").json()

    parsed = datetime.fromisoformat(body["now"])

    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_two_sequential_calls_differ(client: TestClient):
    """FEAT-1: now is computed per request, so two calls return different values."""
    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """The endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent, and the header still holds."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
