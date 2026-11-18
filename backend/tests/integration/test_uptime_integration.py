"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client: TestClient):
    """Criterion 1: 200 with exactly the two documented keys and types."""
    response = client.get("/api/uptime")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert isinstance(body["started_at"], str)


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200
    assert response.json()["uptime_seconds"] >= 0


def test_get_uptime_uptime_seconds_increases_between_calls_one_second_apart(
    client: TestClient,
):
    """Criterion 2: non-negative, and a real one-second gap shows in the value."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second > first


def test_get_uptime_started_at_is_identical_across_requests(client: TestClient):
    """Criterion 3: started_at is captured once, across requests and app instances."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]
    with TestClient(create_app()) as other_client:
        third = other_client.get("/api/uptime").json()["started_at"]

    assert first == second == third


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: started_at parses as an aware UTC datetime ending in +00:00."""
    started_at = client.get("/api/uptime").json()["started_at"]

    parsed = datetime.fromisoformat(started_at)
    assert started_at.endswith("+00:00")
    assert parsed.utcoffset() == timedelta(0)


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
