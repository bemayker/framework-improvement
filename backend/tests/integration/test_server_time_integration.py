"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP cycle."""

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.services import server_time_service


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Criterion 1: 200 with the exact body shape, `now` aware with +00:00."""
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset().total_seconds() == 0


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries `Cache-Control: no-store`."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_fresh_now_on_each_request(client: TestClient, monkeypatch):
    """Criterion 3 (origin side): the router never reuses a previous value."""
    clock_values = iter(
        [
            datetime(2026, 11, 27, 18, 30, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 27, 18, 30, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(clock_values))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
