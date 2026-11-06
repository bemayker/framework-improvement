"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Contract: 200, exactly `now` and `timezone`, now is an aware UTC value."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response header keeps the CDN from caching the body."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_every_response_carries_cache_control_no_store(client: TestClient):
    """Criterion 3 proxy: repeated calls each carry the header."""
    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the route is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
