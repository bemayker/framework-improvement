"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criterion 1: 200 with exactly the two documented keys."""
    response = client.get("/api/uptime")
    body = response.json()

    assert response.status_code == 200
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: started_at ends in +00:00 and is a past UTC instant."""
    started_at_text = client.get("/api/uptime").json()["started_at"]

    parsed = datetime.fromisoformat(started_at_text)

    assert started_at_text.endswith("+00:00")
    assert parsed.utcoffset() == timedelta(0)
    assert parsed <= datetime.now(timezone.utc)


def test_get_uptime_increases_between_calls_a_second_apart(client: TestClient):
    """Criteria 2 and 3: uptime grows by a second, started_at stays identical."""
    first = client.get("/api/uptime").json()
    time.sleep(1)
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] >= first["uptime_seconds"] + 1.0
    assert second["started_at"] == first["started_at"]


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """The start capture does not depend on the lifespan's database branch."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
