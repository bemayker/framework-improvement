"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_exactly_the_documented_keys(client: TestClient):
    """Criteria 1 and 3: shape, a non-negative number, and a UTC +00:00 timestamp."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0
    assert body["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_increases_and_keeps_started_at_across_calls_a_second_apart():
    """Criteria 2 and 3: uptime grows; started_at is captured once, not per request."""
    with TestClient(create_app()) as fresh_client:
        first = fresh_client.get("/api/uptime").json()
        time.sleep(1)
        second = fresh_client.get("/api/uptime").json()

    assert second["uptime_seconds"] > first["uptime_seconds"]
    assert second["started_at"] == first["started_at"]


def test_get_uptime_started_at_equals_value_captured_at_startup():
    """Criterion 3: the reported start is the one stored on the app at creation."""
    app = create_app()
    expected = app.state.process_start.started_at.isoformat()

    with TestClient(app) as fresh_client:
        body = fresh_client.get("/api/uptime").json()

    assert body["started_at"] == expected


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
