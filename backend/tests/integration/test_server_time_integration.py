"""Router integration tests for GET /api/time (FEAT-1), through real HTTP."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: 200 with exactly `now` and `timezone`, offset zero."""
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_now_ends_with_plus_zero_offset_suffix(client: TestClient):
    """The offset is spelled `+00:00`, never `Z`."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_get_time_computes_now_per_request(client: TestClient, monkeypatch):
    """Two requests return the two clock readings in order."""
    readings = iter(
        [
            datetime(2026, 11, 27, 14, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 27, 14, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(
        "app.routers.server_time.current_utc_time", lambda: next(readings)
    )

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first == "2026-11-27T14:00:00+00:00"
    assert second == "2026-11-27T14:00:01+00:00"


def test_get_time_now_is_read_at_request_time(client: TestClient):
    """The real clock is read during the request, not fixed at import."""
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
