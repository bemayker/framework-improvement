"""Integration tests for GET /api/uptime (TEST-07), through the shared client."""

from datetime import datetime, timedelta

from app.services import uptime_service


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client):
    """Happy path: 200 with exactly the two documented keys."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    datetime.fromisoformat(body["started_at"])


def test_get_uptime_seconds_is_non_negative_and_increases_a_second_apart(
    client, monkeypatch
):
    """Two calls a (faked) second apart: both non-negative, the second larger."""
    start = client.app.state.process_start.started_monotonic
    readings = iter([start + 5.0, start + 6.0])
    monkeypatch.setattr(uptime_service, "monotonic", lambda: next(readings))

    first = client.get("/api/uptime").json()["uptime_seconds"]
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second >= 0
    assert second > first


def test_get_uptime_started_at_is_identical_across_requests(client):
    """started_at is captured once, so every response carries the same value."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_is_utc_with_explicit_offset(client):
    """started_at ends in +00:00 and equals the app's captured start."""
    started_at = client.get("/api/uptime").json()["started_at"]

    parsed = datetime.fromisoformat(started_at)
    assert started_at.endswith("+00:00")
    assert parsed.utcoffset() == timedelta(0)
    assert parsed == client.app.state.process_start.started_at


def test_get_uptime_openapi_response_uses_uptime_response_schema(client):
    """The declared 200 response model is the UptimeResponse schema."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()["paths"]["/api/uptime"]["get"]["responses"]["200"][
        "content"
    ]["application/json"]["schema"]
    assert schema["$ref"] == "#/components/schemas/UptimeResponse"


def test_post_uptime_returns_405_method_not_allowed(client):
    """Error case: the endpoint only answers GET."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
