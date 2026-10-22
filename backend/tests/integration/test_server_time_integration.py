"""Integration tests for GET /api/time (FEAT-1). No database is needed."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def _get_now(client: TestClient) -> str:
    response = client.get("/api/time")
    assert response.status_code == 200
    return response.json()["now"]


def test_get_time_returns_200_with_exactly_now_and_timezone(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    assert set(response.json()) == {"now", "timezone"}


def test_get_time_timezone_is_utc(client: TestClient):
    assert client.get("/api/time").json()["timezone"] == "UTC"


def test_get_time_now_has_explicit_zero_offset_not_z(client: TestClient):
    now = _get_now(client)

    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_now_lies_between_clock_readings_around_the_call(client: TestClient):
    before = datetime.now(timezone.utc)
    now = datetime.fromisoformat(_get_now(client))
    after = datetime.now(timezone.utc)

    assert before <= now <= after


def test_get_time_is_computed_per_request(client: TestClient):
    first = datetime.fromisoformat(_get_now(client))
    time.sleep(1)
    second = datetime.fromisoformat(_get_now(client))

    assert second != first
    assert second > first


def test_post_time_returns_405(client: TestClient):
    assert client.post("/api/time").status_code == 405
