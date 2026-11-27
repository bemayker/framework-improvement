"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP cycle."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient

FIRST_INSTANT = datetime(2026, 11, 27, 15, 30, 1, 123456, tzinfo=UTC)
SECOND_INSTANT = datetime(2026, 11, 27, 15, 30, 2, 123456, tzinfo=UTC)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient, monkeypatch):
    """FEAT-1 contract: aware UTC `now` ending in +00:00, and timezone UTC."""
    monkeypatch.setattr("app.routers.server_time.utc_now", lambda: FIRST_INSTANT)

    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.json() == {"now": "2026-11-27T15:30:01.123456+00:00", "timezone": "UTC"}


def test_get_time_two_calls_return_different_now(client: TestClient, monkeypatch):
    """Criterion 3 (app side): `now` is computed per request, never cached in-app."""
    instants = iter([FIRST_INSTANT, SECOND_INSTANT])
    monkeypatch.setattr("app.routers.server_time.utc_now", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Edge case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
