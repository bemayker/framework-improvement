"""Integration tests for GET /api/time (BUG-01), through the app's test client."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service


def test_get_server_time_sets_cache_control_no_store(client):
    """Criterion 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_server_time_returns_aware_utc_body(client):
    """Body shape: `now` is aware ISO 8601 with +00:00, timezone is UTC."""
    body = client.get("/api/time").json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_server_time_now_differs_between_requests(client, monkeypatch):
    """Criterion 2 and 3 locally: no app-side caching, no-store on every response."""
    first = datetime(2026, 11, 13, 9, 0, 0, tzinfo=timezone.utc)
    readings = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(readings))

    first_response = client.get("/api/time")
    second_response = client.get("/api/time")

    assert first_response.json()["now"] != second_response.json()["now"]
    assert first_response.headers["cache-control"] == "no-store"
    assert second_response.headers["cache-control"] == "no-store"


def test_post_server_time_returns_method_not_allowed(client):
    """Error case: a non-GET method is rejected with 405."""
    response = client.post("/api/time")

    assert response.status_code == 405
