"""Integration tests for GET /api/uptime (TEST-07): the full HTTP cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_number_and_utc_started_at(client):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0
    assert body["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_twice_increases_uptime_and_keeps_started_at(client):
    first = client.get("/api/uptime").json()
    time.sleep(0.05)
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] > first["uptime_seconds"]
    assert second["started_at"] == first["started_at"]


def test_get_uptime_started_at_is_captured_at_startup_and_stable():
    before = datetime.now(timezone.utc)
    with TestClient(create_app()) as fresh_client:
        after = datetime.now(timezone.utc)
        first = fresh_client.get("/api/uptime").json()
        time.sleep(0.02)
        later = fresh_client.get("/api/uptime").json()

    assert before <= datetime.fromisoformat(first["started_at"]) <= after
    assert later["started_at"] == first["started_at"]


def test_post_uptime_returns_405(client):
    assert client.post("/api/uptime").status_code == 405
