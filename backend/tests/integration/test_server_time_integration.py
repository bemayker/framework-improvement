"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time

FIRST_INSTANT = datetime(2026, 10, 30, 19, 12, 3, tzinfo=UTC)


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Happy path: body carries a timezone-aware UTC `now` and `timezone` UTC."""
    response = client.get("/api/time")

    body = response.json()
    parsed_now = datetime.fromisoformat(body["now"])
    assert response.status_code == 200
    assert body["timezone"] == "UTC"
    assert parsed_now.utcoffset() == timedelta(0)


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response header keeps the CDN from caching it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_sequential_calls_each_no_store_and_return_different_now(
    client: TestClient, monkeypatch
):
    """Criterion 3 mechanism: two calls both carry no-store and differ in `now`."""
    instants = iter([FIRST_INSTANT, FIRST_INSTANT + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "utc_now", lambda: next(instants))

    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"
    assert first.json()["now"] != second.json()["now"]


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only and accepts no other method."""
    response = client.post("/api/time")

    assert response.status_code == 405
