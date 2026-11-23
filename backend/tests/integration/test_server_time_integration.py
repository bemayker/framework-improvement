"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Happy path: 200, exactly now and timezone, now aware with a zero offset."""
    response = client.get("/api/time")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"
    parsed = datetime.fromisoformat(payload["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """BUG-01: the response forbids storing, so an edge cache cannot hold it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_two_requests_return_different_now(client: TestClient):
    """BUG-01: each request gets a fresh value and each carries no-store.

    The edge cache only exists on the deployed environment, so this pins both
    halves of the cause locally: a new value per request, and the directive
    that stops a cache from replaying one.
    """
    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"
    assert datetime.fromisoformat(first.json()["now"]) != datetime.fromisoformat(
        second.json()["now"]
    )


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only and accepts no input."""
    response = client.post("/api/time")

    assert response.status_code == 405
