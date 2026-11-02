"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: exactly the keys now and timezone, timezone is UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_aware_with_zero_offset(client: TestClient):
    """The now value carries an explicit UTC offset and is never naive."""
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response forbids edge caching."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_a_fresh_now_per_request(client: TestClient):
    """Edge case: two requests a moment apart do not return the same now."""
    first = client.get("/api/time").json()["now"]
    time.sleep(0.01)
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
