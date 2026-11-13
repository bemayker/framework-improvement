"""Integration tests for GET /api/time, full HTTP request/response cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_sets_cache_control_no_store(client: TestClient):
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_returns_fresh_now_per_request(client: TestClient):
    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
