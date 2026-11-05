"""Integration tests for GET /api/uptime through the real HTTP cycle.

The endpoint needs no database, so no database fixture is requested.
"""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_uptime_returns_200_with_exact_keys_and_utc_offset(client: TestClient):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0
    assert body["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_started_at_is_identical_across_calls(client: TestClient):
    first = client.get("/api/uptime").json()
    second = client.get("/api/uptime").json()

    assert first["started_at"] == second["started_at"]


def test_get_uptime_increases_between_calls_a_second_apart(client: TestClient):
    first = client.get("/api/uptime").json()
    time.sleep(1.0)
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] > first["uptime_seconds"]
    assert second["started_at"] == first["started_at"]


def test_post_uptime_returns_405(client: TestClient):
    response = client.post("/api/uptime")

    assert response.status_code == 405
