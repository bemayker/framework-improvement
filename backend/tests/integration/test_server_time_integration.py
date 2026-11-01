"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.routers.server_time import NO_STORE_CACHE_CONTROL


def test_get_time_returns_200_with_aware_utc_now_and_timezone(client: TestClient):
    """Happy path: exactly now and timezone, now parses as aware UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """BUG-01 criteria 1 and 2: the response forbids any cache storing it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == NO_STORE_CACHE_CONTROL


def test_get_time_sequential_calls_differ_and_both_carry_no_store(client: TestClient):
    """Local half of criterion 3: each call is computed fresh and stays uncacheable."""
    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.headers["cache-control"] == NO_STORE_CACHE_CONTROL
    assert second.headers["cache-control"] == NO_STORE_CACHE_CONTROL
    assert first.json()["now"] != second.json()["now"]


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
