"""Integration tests for GET /api/uptime (TEST-07).

The session-scoped `client` fixture enters the app lifespan, so the real
startup capture runs. No database is needed.
"""

from datetime import UTC, datetime, timedelta

import pytest

from app.services import uptime_service


def _patch_clock_to_mark_plus(monkeypatch, client, offset: float) -> None:
    mark = client.app.state.startup
    monkeypatch.setattr(
        uptime_service, "monotonic", lambda: mark.started_monotonic + offset
    )


def test_get_uptime_returns_200_with_uptime_and_started_at(client):
    """Happy path: 200, exactly the two documented keys, valid values."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], int | float)
    assert body["uptime_seconds"] >= 0
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_increases_between_calls_a_second_apart(client, monkeypatch):
    """uptime_seconds grows by the elapsed second between two calls."""
    _patch_clock_to_mark_plus(monkeypatch, client, 5.0)
    first = client.get("/api/uptime").json()["uptime_seconds"]
    _patch_clock_to_mark_plus(monkeypatch, client, 6.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first == pytest.approx(5.0)
    assert second - first == pytest.approx(1.0)


def test_get_uptime_returns_same_started_at_on_every_call(client, monkeypatch):
    """started_at is captured once at startup, not recomputed per request."""
    _patch_clock_to_mark_plus(monkeypatch, client, 1.0)
    first = client.get("/api/uptime").json()["started_at"]
    _patch_clock_to_mark_plus(monkeypatch, client, 2.0)
    second = client.get("/api/uptime").json()["started_at"]

    captured = client.app.state.startup.started_at
    assert first == second
    assert datetime.fromisoformat(first) == captured


def test_get_uptime_started_at_is_not_later_than_request_time(client):
    """Edge case: the startup instant precedes the request."""
    body = client.get("/api/uptime").json()
    after = datetime.now(UTC)

    assert datetime.fromisoformat(body["started_at"]) <= after


def test_post_uptime_returns_405(client):
    """Error case: the route is GET-only."""
    assert client.post("/api/uptime").status_code == 405
