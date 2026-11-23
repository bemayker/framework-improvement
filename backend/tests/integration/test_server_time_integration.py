"""Integration tests for GET /api/time through the full request cycle (FEAT-1)."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: 200 with exactly the `now` and `timezone` keys."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_plus_00_00_offset(client: TestClient):
    """`now` is aware, zero-offset, and ends with the pinned `+00:00` suffix."""
    now = client.get("/api/time").json()["now"]

    parsed = datetime.fromisoformat(now)
    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_now_is_computed_per_request(client: TestClient, monkeypatch):
    """The handler reads the clock on every request, not once at import."""
    instants = iter(
        [
            datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr("app.routers.server_time._utc_now", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first == "2026-01-01T00:00:00.000000+00:00"
    assert second == "2026-01-01T00:00:01.000000+00:00"


def test_get_time_now_advances_between_real_requests(client: TestClient):
    """On the real clock, two consecutive calls give strictly increasing `now`."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first


def test_post_time_returns_405(client: TestClient):
    """Error case: only GET is allowed on /api/time."""
    response = client.post("/api/time")

    assert response.status_code == 405
