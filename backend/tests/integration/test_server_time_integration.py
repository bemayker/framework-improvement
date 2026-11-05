"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_utc_body_with_explicit_offset(client: TestClient):
    """FEAT-1 shape: exactly `now` and `timezone`, `now` aware with +00:00."""
    response = client.get("/api/time")
    body = response.json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_returns_a_fresh_value_per_request(client: TestClient, monkeypatch):
    """Criterion 3 (cause): `now` is computed per request, not cached by the app."""
    instants = iter(
        [
            datetime(2026, 11, 5, 8, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 5, 8, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
