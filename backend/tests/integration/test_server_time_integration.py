"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time
from app.routers.server_time import NO_STORE


def test_get_time_returns_200_with_now_and_timezone_keys(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_iso_8601_with_explicit_utc_offset(client: TestClient):
    body = client.get("/api/time").json()

    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """BUG-01 criterion 2: the response forbids any cache from storing it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == NO_STORE


def test_get_time_returns_different_now_on_each_call(client: TestClient, monkeypatch):
    ticks = iter(
        [
            datetime(2026, 11, 4, 19, 40, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 4, 19, 40, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "get_server_time", lambda: next(ticks))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
