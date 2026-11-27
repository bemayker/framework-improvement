"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.services import server_time_service


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Criterion 1: the contract body, an aware UTC instant and its label."""
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).tzinfo is not None


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: every response tells the CDN not to store it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_fresh_now_on_each_call(client: TestClient, monkeypatch):
    """Criterion 3 (automated part): the app serves a different now per call."""
    instants = iter(
        [
            datetime(2026, 11, 27, 17, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 27, 17, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
