"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200 with exactly the keys now and timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_plus_00_00_offset(client: TestClient):
    """Criterion 2: the offset is the explicit `+00:00`, so the time is aware."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_now_is_computed_per_request(client: TestClient):
    """Criterion 2: each response lies in its own request window, in order."""
    readings = []
    for _ in range(2):
        before = datetime.now(UTC)
        now = datetime.fromisoformat(client.get("/api/time").json()["now"])
        after = datetime.now(UTC)
        readings.append((before, now, after))

    for before, now, after in readings:
        assert before <= now <= after
    assert readings[1][1] > readings[0][1]


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
