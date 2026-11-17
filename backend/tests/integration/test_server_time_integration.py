"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """FEAT-1 contract: 200, exactly `now` and `timezone`, `now` aware UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response forbids any cache from storing it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_fresh_now_per_request(client: TestClient, monkeypatch):
    """Criterion 3 (automated part): `now` is computed per request."""
    instants = iter(
        [
            datetime(2026, 11, 17, 19, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 17, 19, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """The endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
