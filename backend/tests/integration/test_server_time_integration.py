"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers import server_time
from app.routers.server_time import NO_STORE


def test_get_server_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Criterion 1: 200 with `now` (aware, zero offset) and `timezone` UTC, no other keys."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_server_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the edge cache is told not to store the response."""
    response = client.get("/api/time")

    assert response.headers["Cache-Control"] == NO_STORE


def test_get_server_time_returns_fresh_now_per_request(client: TestClient, monkeypatch):
    """Criterion 3 (local half): `now` is computed per request, not cached."""
    instants = iter(
        [
            datetime(2026, 11, 17, 2, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 17, 2, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_get_server_time_answers_when_database_url_is_unset(monkeypatch):
    """No database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == NO_STORE


def test_post_server_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
