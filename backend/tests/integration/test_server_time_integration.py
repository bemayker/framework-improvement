"""Integration tests for GET /api/time (FEAT-1, recreated by BUG-01), full HTTP cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.services import server_time_service


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response forbids caching, so an edge cache stores nothing."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Criterion 1: 200 with exactly `now` (explicit +00:00 offset) and `timezone`."""
    response = client.get("/api/time")
    body = response.json()

    assert response.status_code == 200
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_now_is_computed_per_request(client: TestClient, monkeypatch):
    """Criterion 3 (local form): two requests return two different `now` values."""
    instants = iter(
        [
            datetime(2026, 11, 19, 1, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 19, 1, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "utc_now", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
