"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle.

The endpoint needs no database, so each test builds its own app with
DATABASE_URL unset and uses the client without its context manager (no lifespan,
hence no schema initialisation).
"""

import time
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def uptime_client(monkeypatch) -> TestClient:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    return TestClient(create_app())


def test_get_uptime_returns_200_with_exactly_the_documented_shape(
    uptime_client: TestClient,
):
    response = uptime_client.get("/api/uptime")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {"uptime_seconds", "started_at"}
    assert isinstance(payload["uptime_seconds"], (int, float))
    assert payload["uptime_seconds"] >= 0

    started_at = datetime.fromisoformat(payload["started_at"])
    assert started_at.utcoffset() == timedelta(0)
    assert payload["started_at"].endswith("+00:00")


def test_get_uptime_increases_across_a_one_second_gap_with_stable_started_at(
    uptime_client: TestClient,
):
    first = uptime_client.get("/api/uptime").json()
    time.sleep(1.0)
    second = uptime_client.get("/api/uptime").json()

    assert second["uptime_seconds"] > first["uptime_seconds"]
    assert second["uptime_seconds"] - first["uptime_seconds"] >= 1.0
    assert second["started_at"] == first["started_at"]


def test_post_uptime_returns_405_method_not_allowed(uptime_client: TestClient):
    response = uptime_client.post("/api/uptime")

    assert response.status_code == 405
