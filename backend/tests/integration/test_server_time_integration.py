"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_server_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: every response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_server_time_returns_utc_body_with_plus_zero_offset(client: TestClient):
    body = client.get("/api/time").json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_value_per_request(client: TestClient, monkeypatch):
    """Criterion 3 locally: per-request freshness, both responses no-store."""
    ticks = iter(
        [
            datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC),
            datetime(2026, 1, 1, 12, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(ticks))

    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.json()["now"] != second.json()["now"]
    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_post_server_time_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
