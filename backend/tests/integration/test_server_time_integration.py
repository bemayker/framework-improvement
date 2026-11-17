"""Integration tests for GET /api/time (FEAT-1, BUG-01). No database needed."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service


def test_get_server_time_returns_no_store_cache_control(client):
    """BUG-01: the response tells every cache not to store it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_server_time_returns_200_with_utc_now_and_explicit_offset(client):
    """Happy path: 200, UTC timezone and a `now` with an explicit offset."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_now_per_request(client, monkeypatch):
    """Two requests get two different `now` values (no origin-side caching)."""
    first = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    values = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(
        server_time_service, "get_current_utc_time", lambda: next(values)
    )

    first_now = client.get("/api/time").json()["now"]
    second_now = client.get("/api/time").json()["now"]

    assert first_now != second_now


def test_post_server_time_returns_405_method_not_allowed(client):
    """Error case: only GET is served."""
    response = client.post("/api/time")

    assert response.status_code == 405
