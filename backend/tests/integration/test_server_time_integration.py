"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200 with exactly `now` and `timezone` == UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_now_ends_with_plus_00_00_offset(client: TestClient):
    """Criterion 2: the offset is the explicit +00:00, never Z, never naive."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_get_time_two_calls_a_second_apart_differ(client: TestClient):
    """Criterion 2: now is computed per request."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    time.sleep(1)
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first
    assert second - first >= timedelta(seconds=1)


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
