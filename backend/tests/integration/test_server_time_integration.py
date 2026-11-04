"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: every response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_body_has_exactly_now_and_timezone_with_utc_offset(client: TestClient):
    """Body shape: only `now` and `timezone`, `now` parses with a zero offset."""
    body = client.get("/api/time").json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_returns_different_now_on_consecutive_requests(
    client: TestClient, monkeypatch
):
    """Per-request freshness: the clock is patched to advance, no sleeping."""
    ticks = iter(
        [
            datetime(2026, 11, 4, 0, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 4, 0, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "get_server_now", lambda: next(ticks))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
