"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client: TestClient):
    """Criterion 1: 200 with exactly the two documented fields."""
    response = client.get("/api/uptime")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], float)
    assert body["uptime_seconds"] >= 0
    datetime.fromisoformat(body["started_at"])


def test_get_uptime_seconds_increases_between_calls_a_second_apart(client: TestClient):
    """Criterion 2: the real clock advances by about the sleep between calls."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert second > first
    assert second - first >= 0.9


def test_get_uptime_started_at_is_identical_across_requests(client: TestClient):
    """Criterion 3: started_at is captured once, not recomputed per request."""
    first = client.get("/api/uptime").json()["started_at"]
    time.sleep(0.05)
    second = client.get("/api/uptime").json()["started_at"]

    expected = client.app.state.startup_clock.started_at.isoformat()
    assert first == second == expected


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: +00:00 offset, zero utcoffset, and not in the future."""
    started_at = client.get("/api/uptime").json()["started_at"]

    parsed = datetime.fromisoformat(started_at)
    assert started_at.endswith("+00:00")
    assert parsed.utcoffset() == timedelta(0)
    assert parsed <= datetime.now(timezone.utc)


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
