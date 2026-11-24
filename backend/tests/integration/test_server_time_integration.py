"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_server_time_returns_200_with_now_and_timezone(client: TestClient):
    """Criterion 1: 200 with exactly the keys now and timezone, timezone UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_server_time_now_has_explicit_plus_zero_offset(client: TestClient):
    """Criterion 2: now ends in +00:00 (never Z) and parses to an aware UTC value."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    parsed = datetime.fromisoformat(now)
    assert parsed.utcoffset() == timedelta(0)


def test_get_server_time_now_is_computed_per_request(client: TestClient, monkeypatch):
    """Criterion 2: two requests one second apart return different now values."""
    first = datetime(2026, 11, 24, 4, 0, 0, tzinfo=timezone.utc)
    instants = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "_utc_now", lambda: next(instants))

    first_now = client.get("/api/time").json()["now"]
    second_now = client.get("/api/time").json()["now"]

    assert first_now == "2026-11-24T04:00:00.000000+00:00"
    assert second_now == "2026-11-24T04:00:01.000000+00:00"


def test_get_server_time_now_is_close_to_current_utc_time(client: TestClient):
    """Criterion 2: an unpatched now lies within a few seconds of the real UTC time."""
    before = datetime.now(timezone.utc)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(timezone.utc)

    assert before - timedelta(seconds=5) <= now <= after + timedelta(seconds=5)


def test_post_server_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
