"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.services import server_time_service


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200 with exactly the keys now and timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_carries_explicit_utc_offset(client: TestClient):
    """Criterion 2: now parses, is aware, is UTC and spells the offset +00:00."""
    raw = client.get("/api/time").json()["now"]

    parsed = datetime.fromisoformat(raw)
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)
    assert raw.endswith("+00:00")


def test_get_time_computes_now_per_request(client: TestClient, monkeypatch):
    """Criterion 2: two requests see two clock readings, so nothing is cached."""
    first = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    clock = iter([first, second])
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(clock))

    first_now = client.get("/api/time").json()["now"]
    second_now = client.get("/api/time").json()["now"]

    assert first_now == "2026-01-01T12:00:00+00:00"
    assert second_now == "2026-01-01T12:00:01+00:00"


def test_get_time_now_does_not_go_backwards_between_requests(client: TestClient):
    """Criterion 2: with the real clock the second now is not earlier."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second >= first


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
