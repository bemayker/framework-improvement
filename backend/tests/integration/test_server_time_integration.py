"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time
from app.routers.server_time import CACHE_CONTROL_NO_STORE


def test_get_server_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: exact keys, aware zero-offset `now`, timezone UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_server_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response header that keeps the CDN from caching."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"
    assert response.headers["cache-control"] == CACHE_CONTROL_NO_STORE


def test_get_server_time_two_calls_return_different_now(client: TestClient, monkeypatch):
    """Per-request freshness: a moving clock yields two different `now` values."""
    instants = iter(
        [
            datetime(2026, 11, 8, 2, 30, 15, tzinfo=UTC),
            datetime(2026, 11, 8, 2, 30, 16, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_server_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
