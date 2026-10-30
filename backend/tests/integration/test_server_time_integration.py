"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200 with exactly the keys `now` and `timezone`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_has_exact_plus_00_00_suffix(client: TestClient):
    """Criterion 2: `now` is UTC with the pinned `+00:00` suffix, never naive."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_is_computed_per_request_with_substituted_clock(
    client: TestClient, monkeypatch
):
    """Criterion 2: two requests one (substituted) second apart differ."""
    instants = iter(
        [
            datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first == "2026-01-01T00:00:00+00:00"
    assert second == "2026-01-01T00:00:01+00:00"


def test_get_time_real_clock_is_monotonic_and_current(client: TestClient):
    """Criterion 2: with the real clock, values are current and non-decreasing."""
    before = datetime.now(UTC)
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert first <= second
    assert before - timedelta(seconds=5) <= first
    assert second <= after + timedelta(seconds=5)


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
