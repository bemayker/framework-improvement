"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers.server_time import CACHE_CONTROL_NO_STORE
from app.services import server_time_service


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: every response tells the edge cache not to store it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == CACHE_CONTROL_NO_STORE
    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Criterion 1: 200 with exactly `now` and `timezone`, `now` in UTC with an offset."""
    response = client.get("/api/time")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"
    assert payload["now"].endswith("+00:00")
    parsed = datetime.fromisoformat(payload["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_returns_fresh_now_per_request(client: TestClient, monkeypatch):
    """Criterion 3 at origin: two requests a second apart return different `now` values."""
    instants = iter(
        [
            datetime(2026, 11, 27, 16, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 27, 16, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
