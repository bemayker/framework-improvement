"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_server_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries `Cache-Control: no-store`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_server_time_returns_utc_body_with_explicit_offset(client: TestClient):
    """Body has exactly `now` and `timezone`, and `now` is aware UTC ending `+00:00`."""
    body = client.get("/api/time").json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_post_server_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    assert client.post("/api/time").status_code == 405


def test_get_server_time_returns_fresh_value_per_request(client: TestClient, monkeypatch):
    """Criterion 3 locally: two requests with an advancing clock return different `now`."""
    first = datetime(2026, 11, 10, 1, 0, 0, tzinfo=UTC)
    ticks = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(ticks))

    first_response = client.get("/api/time")
    second_response = client.get("/api/time")

    assert first_response.json()["now"] != second_response.json()["now"]
    assert second_response.headers["cache-control"] == "no-store"
