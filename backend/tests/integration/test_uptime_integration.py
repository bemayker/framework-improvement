"""Integration tests for GET /api/uptime (TEST-07) through the HTTP cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_the_two_fields(client: TestClient):
    before = datetime.now(timezone.utc)

    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    uptime = body["uptime_seconds"]
    assert isinstance(uptime, (int, float)) and not isinstance(uptime, bool)
    assert uptime >= 0
    started_at = datetime.fromisoformat(body["started_at"])
    assert body["started_at"].endswith("+00:00")
    assert started_at.utcoffset() == timedelta(0)
    assert started_at <= before + timedelta(seconds=uptime + 1)
    assert started_at <= datetime.now(timezone.utc)


def test_get_uptime_twice_a_second_apart_grows_and_keeps_started_at(
    client: TestClient,
):
    first = client.get("/api/uptime").json()
    time.sleep(1.0)  # the one-second interval is the acceptance criterion itself
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] > first["uptime_seconds"]
    assert second["started_at"] == first["started_at"]


def test_get_uptime_started_at_equals_the_mark_captured_at_app_creation():
    app = create_app()
    expected = app.state.uptime_start.started_at

    with TestClient(app) as fresh_client:
        body = fresh_client.get("/api/uptime").json()

    assert datetime.fromisoformat(body["started_at"]) == expected


def test_post_uptime_returns_405(client: TestClient):
    response = client.post("/api/uptime")

    assert response.status_code == 405
