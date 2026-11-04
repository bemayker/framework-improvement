"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle.

No database is used.
"""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200 with exactly now and timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_aware_utc_ending_in_plus_zero_offset(client: TestClient):
    """Criterion 2: explicit +00:00 offset, never Z, never naive."""
    now = client.get("/api/time").json()["now"]

    parsed = datetime.fromisoformat(now)
    assert parsed.utcoffset() == timedelta(0)
    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_get_time_returns_a_fresh_value_per_request(client: TestClient, monkeypatch):
    """Criterion 2: two requests with a patched clock return its two instants."""
    first = datetime(2026, 11, 4, 19, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    instants = iter([first, second])
    monkeypatch.setattr(server_time, "utc_now", lambda: next(instants))

    first_now = client.get("/api/time").json()["now"]
    second_now = client.get("/api/time").json()["now"]

    assert first_now == "2026-11-04T19:00:00+00:00"
    assert second_now == "2026-11-04T19:00:01+00:00"
    assert first_now != second_now


def test_get_time_now_is_computed_at_request_time(client: TestClient):
    """Criterion 2: the real clock value lies between readings around the request."""
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
