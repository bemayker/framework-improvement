"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP cycle."""

import time
from datetime import datetime

from fastapi.testclient import TestClient

# Microsecond resolution already separates two calls; this only guards against
# a coarse clock, so it stays minimal.
SEPARATION_SECONDS = 0.001


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """FEAT-1 shape: 200, exactly `now` and `timezone`, aware UTC `now`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    offset = datetime.fromisoformat(body["now"]).utcoffset()
    assert offset is not None
    assert offset.total_seconds() == 0


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response header stops the edge cache."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_two_sequential_calls_return_different_now(client: TestClient):
    """Criterion 3, local proxy: each request gets its own fresh `now`."""
    first = client.get("/api/time").json()["now"]
    time.sleep(SEPARATION_SECONDS)
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
