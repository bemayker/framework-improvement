"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.uptime import UptimeResponse
from app.services import uptime_service


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at():
    """Criterion 1: 200 with exactly the two documented keys."""
    with TestClient(create_app()) as client:
        response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert isinstance(body["started_at"], str)


def test_get_uptime_seconds_increases_between_two_calls(monkeypatch):
    """Criterion 2: with the clock advanced one second, the value grows by one."""
    app = create_app()
    base = app.state.startup.started_monotonic
    readings = iter([base + 10.0, base + 11.0])
    monkeypatch.setattr(uptime_service, "monotonic", lambda: next(readings))

    with TestClient(app) as client:
        first = client.get("/api/uptime").json()["uptime_seconds"]
        second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first == 10.0
    assert second == 11.0
    assert second > first >= 0


def test_get_uptime_started_at_is_identical_across_calls():
    """Criterion 3: started_at is captured once, not recomputed per request."""
    with TestClient(create_app()) as client:
        first = client.get("/api/uptime").json()["started_at"]
        second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_is_utc_with_explicit_offset():
    """Criterion 3: the wire format ends in +00:00, never Z."""
    with TestClient(create_app()) as client:
        started_at = client.get("/api/uptime").json()["started_at"]

    assert started_at.endswith("+00:00")


def test_get_uptime_body_matches_uptime_response_schema():
    """Criterion 4: the body validates against the Pydantic schema."""
    with TestClient(create_app()) as client:
        body = client.get("/api/uptime").json()

    parsed = UptimeResponse.model_validate(body)

    assert parsed.uptime_seconds >= 0


def test_post_uptime_returns_405_method_not_allowed():
    """Error case: the endpoint is read-only."""
    with TestClient(create_app()) as client:
        response = client.post("/api/uptime")

    assert response.status_code == 405
