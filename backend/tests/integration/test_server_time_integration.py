"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import time
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_exact_key_set(client: TestClient):
    """Criterion 1: 200 with exactly `now` and `timezone`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert set(response.json()) == {"now", "timezone"}


def test_get_time_timezone_is_utc(client: TestClient):
    """Criterion 1: the timezone field is the literal UTC."""
    assert client.get("/api/time").json()["timezone"] == "UTC"


def test_get_time_now_ends_with_plus_zero_offset_and_parses_as_utc(client: TestClient):
    """Criterion 2: explicit `+00:00` suffix, never `Z`, never naive."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_now_lies_within_request_window(client: TestClient):
    """Criterion 2: `now` is the server clock at request time."""
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_get_time_two_requests_differ_and_increase(client: TestClient):
    """Criterion 2: `now` is computed per request, not cached."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    time.sleep(0.05)
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is GET only."""
    assert client.post("/api/time").status_code == 405


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """BUG-01 criteria 1 and 2: the response header keeps edge caches from storing it."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
