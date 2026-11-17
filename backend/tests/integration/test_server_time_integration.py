"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries `Cache-Control: no-store`."""
    response = client.get("/api/time")

    assert response.headers["Cache-Control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Contract shape: `now` has an explicit UTC offset and timezone is UTC."""
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_returns_fresh_now_per_request(client: TestClient):
    """Criterion 3 precondition: two requests do not return the same `now`."""
    first = client.get("/api/time").json()["now"]
    time.sleep(0.01)
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
