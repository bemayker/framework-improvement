"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client: TestClient):
    """Criterion 1: status 200 and exactly the two documented keys."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert not isinstance(body["uptime_seconds"], bool)
    datetime.fromisoformat(body["started_at"])


def test_get_uptime_seconds_is_non_negative_and_increases_a_second_apart(client: TestClient):
    """Criterion 2: non-negative, and larger after one second."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second - first >= 0.9


def test_get_uptime_started_at_is_identical_across_requests(client: TestClient):
    """Criterion 3: started_at is not recomputed per request."""
    first = client.get("/api/uptime").json()
    time.sleep(0.01)
    second = client.get("/api/uptime").json()

    assert first["started_at"] == second["started_at"]
    assert first["uptime_seconds"] != second["uptime_seconds"]


def test_get_uptime_started_at_is_captured_at_startup_not_per_request(monkeypatch):
    """Criterion 3: started_at falls inside the startup window, before the request."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    before = datetime.now(timezone.utc)
    with TestClient(app) as fresh_client:
        after_startup = datetime.now(timezone.utc)
        time.sleep(0.05)
        body = fresh_client.get("/api/uptime").json()

    started_at = datetime.fromisoformat(body["started_at"])
    assert before <= started_at <= after_startup


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: the string ends in Z and parses to a zero offset."""
    started_at = client.get("/api/uptime").json()["started_at"]

    assert started_at.endswith("Z")
    assert datetime.fromisoformat(started_at).utcoffset() == timedelta(0)


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
