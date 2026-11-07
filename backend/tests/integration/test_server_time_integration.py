"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_timezone_utc(client: TestClient):
    """Criterion 1: 200, exactly `now` and `timezone`, now is aware UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_now_ends_with_plus_zero_offset(client: TestClient):
    """Criterion 2: the offset is the explicit +00:00, not Z."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_get_time_returns_a_fresh_value_per_request(client: TestClient):
    """Criterion 2: the clock is read per request, so the second call is later."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
