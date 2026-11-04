"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criteria 1 and 4: 200 with exactly the two schema fields."""
    response = client.get("/api/uptime")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert not isinstance(body["uptime_seconds"], bool)
    assert body["uptime_seconds"] >= 0
    assert isinstance(body["started_at"], str)


def test_get_uptime_increases_between_calls_a_second_apart(client: TestClient):
    """Criterion 2: uptime grows by about the real time waited."""
    first = client.get("/api/uptime").json()
    time.sleep(1.0)
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] > first["uptime_seconds"]
    assert second["uptime_seconds"] - first["uptime_seconds"] >= 0.9


def test_get_uptime_started_at_is_constant_and_utc(client: TestClient):
    """Criterion 3: started_at is identical across calls, UTC, +00:00."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    parsed = datetime.fromisoformat(first)
    assert first == second
    assert first.endswith("+00:00")
    assert parsed.utcoffset() == timedelta(0)
    assert parsed <= datetime.now(UTC)


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
