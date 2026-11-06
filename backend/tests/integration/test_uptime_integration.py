"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client: TestClient):
    """Criteria 1 and 3: the body shape, and an explicit +00:00 UTC offset."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert not isinstance(body["uptime_seconds"], bool)
    assert body["uptime_seconds"] >= 0
    assert body["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_increases_between_two_calls_a_second_apart(client: TestClient):
    """Criteria 2 and 3: uptime grows while started_at stays the same."""
    first = client.get("/api/uptime").json()
    time.sleep(1.0)
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] - first["uptime_seconds"] >= 0.9
    assert second["started_at"] == first["started_at"]


def test_get_uptime_started_at_is_the_value_captured_at_startup():
    """Criterion 3: started_at is the lifespan's mark, not a per-request value."""
    app = create_app()
    with TestClient(app) as fresh_client:
        mark = app.state.start_mark
        response = fresh_client.get("/api/uptime")
    after_request = datetime.now(timezone.utc)

    assert response.json()["started_at"] == mark.started_at.isoformat()
    assert mark.started_at <= after_request


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """Edge case: no database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200
    assert set(response.json()) == {"uptime_seconds", "started_at"}


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
