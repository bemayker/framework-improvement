"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Supporting: status, body shape and an aware UTC `now`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response forbids caches from storing it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_fresh_now_per_request(client: TestClient, monkeypatch):
    """Criterion 3 proxy: each request computes its own `now`."""
    ticks = iter(
        [
            datetime(2026, 11, 13, 10, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 13, 10, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "current_utc_time", lambda: next(ticks))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
