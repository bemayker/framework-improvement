"""Integration tests for GET /api/uptime (TEST-07), full HTTP cycle, no database."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.uptime import UptimeResponse
from app.services import uptime_service


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criteria 1 and 4: 200 and exactly the schema's two fields."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], int | float)
    assert body["uptime_seconds"] >= 0


def test_get_uptime_seconds_increases_between_calls_a_second_apart(monkeypatch):
    """Criterion 2: the clock is faked, so no real wait."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)
    app = create_app()
    with TestClient(app) as fresh_client:
        monkeypatch.setattr(uptime_service, "monotonic", lambda: 101.0)
        first = fresh_client.get("/api/uptime").json()["uptime_seconds"]
        monkeypatch.setattr(uptime_service, "monotonic", lambda: 102.0)
        second = fresh_client.get("/api/uptime").json()["uptime_seconds"]

    assert second > first
    assert second - first == 1.0


def test_get_uptime_started_at_is_identical_across_calls(client: TestClient):
    """Criterion 3: captured once, not recomputed per request."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    expected = UptimeResponse(
        uptime_seconds=0, started_at=client.app.state.process_start.started_at
    ).model_dump(mode="json")["started_at"]
    assert first == second == expected


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: UTC with the Z designator, parseable as an aware value."""
    started_at = client.get("/api/uptime").json()["started_at"]

    parsed = datetime.fromisoformat(started_at)
    assert started_at.endswith("Z")
    assert parsed.utcoffset() == timedelta(0)


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """No database dependency: DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Read-only endpoint: other methods are rejected."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
