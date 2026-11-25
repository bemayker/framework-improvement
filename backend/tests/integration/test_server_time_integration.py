"""Integration tests for GET /api/time through the app's test client (BUG-01)."""

from datetime import UTC, datetime, timedelta

from app.routers.server_time import CACHE_CONTROL_NO_STORE
from app.services import server_time_service


def test_get_server_time_sets_cache_control_no_store(client):
    """The response header is the no-store value the router exports."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == CACHE_CONTROL_NO_STORE


def test_get_server_time_returns_200_with_utc_now_and_timezone(client):
    """Happy path: 200, UTC timezone, and an aware zero-offset instant."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert body["timezone"] == "UTC"
    now = datetime.fromisoformat(body["now"])
    assert now.utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_now_per_request(client, monkeypatch):
    """Two requests carry two different instants, each marked no-store."""
    first = datetime(2026, 11, 25, 8, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    instants = iter([first, second])
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(instants))

    first_response = client.get("/api/time")
    second_response = client.get("/api/time")

    first_now = datetime.fromisoformat(first_response.json()["now"])
    second_now = datetime.fromisoformat(second_response.json()["now"])
    assert (first_now, second_now) == (first, second)
    assert first_response.headers["cache-control"] == CACHE_CONTROL_NO_STORE
    assert second_response.headers["cache-control"] == CACHE_CONTROL_NO_STORE


def test_post_server_time_returns_405_method_not_allowed(client):
    """Error case: only GET is allowed on /api/time."""
    response = client.post("/api/time")

    assert response.status_code == 405
