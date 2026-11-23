"""Integration tests for GET /api/time over the real HTTP cycle (BUG-01)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_utc_now(client: TestClient):
    """Happy path: 200 with `now` and `timezone` keys, `now` being UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_returns_no_store_cache_control(client: TestClient):
    """Acceptance criteria 1 and 2: the response forbids any cache storing it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_successive_requests_return_different_now(client: TestClient):
    """Two requests return different values (clock sequence pinned, no flake)."""
    first = datetime(2026, 11, 23, 20, 14, 21, tzinfo=timezone.utc)
    second = first + timedelta(seconds=1)

    with patch(
        "app.routers.server_time.get_server_time", side_effect=[first, second]
    ):
        first_body = client.get("/api/time").json()
        second_body = client.get("/api/time").json()

    assert first_body["now"] != second_body["now"]


def test_post_time_returns_method_not_allowed(client: TestClient):
    """Error case: the route only answers GET."""
    response = client.post("/api/time")

    assert response.status_code == 405
