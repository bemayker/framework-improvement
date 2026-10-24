"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_exact_keys_and_utc_timezone(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_exact_offset_and_is_aware(client: TestClient):
    response = client.get("/api/time")

    now = response.json()["now"]
    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    parsed = datetime.fromisoformat(now)
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_now_is_computed_at_request_time(client: TestClient):
    before = datetime.now(UTC)
    response = client.get("/api/time")
    after = datetime.now(UTC)

    returned = datetime.fromisoformat(response.json()["now"])
    assert before <= returned <= after


def test_get_time_returns_fresh_value_per_request(client: TestClient, monkeypatch):
    clock_values = iter(
        [
            datetime(2026, 10, 24, 5, 0, 0, tzinfo=UTC),
            datetime(2026, 10, 24, 5, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "utc_now", lambda: next(clock_values))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first == "2026-10-24T05:00:00+00:00"
    assert second == "2026-10-24T05:00:01+00:00"
    assert first != second


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_cache_control_is_set_on_every_request(client: TestClient):
    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
