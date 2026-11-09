"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: exactly the keys `now` and `timezone`, timezone is UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response header keeps the CDN from caching the time."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_now_is_aware_with_explicit_plus_zero_offset(client: TestClient):
    """The wire format is ISO 8601 with a +00:00 offset, never naive, never Z."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_returns_different_now_for_requests_one_second_apart(
    client: TestClient, monkeypatch
):
    """Criterion 3 locally: `now` is per request (clock patched, no sleeping)."""
    first = datetime(2026, 11, 9, 20, 48, 23, tzinfo=UTC)
    instants = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(instants))

    first_now = client.get("/api/time").json()["now"]
    second_now = client.get("/api/time").json()["now"]

    assert first_now != second_now


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
