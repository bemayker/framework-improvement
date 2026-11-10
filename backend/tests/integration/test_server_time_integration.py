"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time as server_time_router


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_plus_zero_offset_suffix(client: TestClient):
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_now_is_computed_per_request(client: TestClient):
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_get_time_two_calls_a_second_apart_differ(client: TestClient, monkeypatch):
    start = datetime(2026, 11, 10, 12, 0, 0, tzinfo=UTC)
    readings = iter([start, start + timedelta(seconds=1)])
    monkeypatch.setattr(server_time_router, "current_utc_time", lambda: next(readings))

    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second - first == timedelta(seconds=1)


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
