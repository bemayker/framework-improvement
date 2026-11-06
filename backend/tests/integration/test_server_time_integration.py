"""Integration tests for GET /api/time through the real HTTP cycle."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_utc_timestamp_with_explicit_offset(client: TestClient):
    """Happy path: 200, the documented body shape, and an offset-bearing `now`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries `Cache-Control: no-store`."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_a_fresh_value_per_request(client: TestClient):
    """Local proxy for the deployed freshness check: two requests differ."""
    first = client.get("/api/time").json()["now"]
    time.sleep(0.01)
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_get_time_scopes_no_store_to_the_time_route(client: TestClient):
    """Edge case: the directive is not applied to other routes."""
    response = client.get("/api/version")

    assert response.headers.get("cache-control") != "no-store"


def test_post_time_is_rejected_with_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
