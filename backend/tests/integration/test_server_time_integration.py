"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers.server_time import current_utc_time


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200 with exactly the keys now and timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).tzinfo is not None


def test_get_time_now_ends_with_plus_zero_offset(client: TestClient):
    """The offset suffix is exactly +00:00, never Z."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_get_time_computes_now_per_request():
    """Two calls get two clock reads, so the values differ (no sleep needed)."""
    readings = iter(
        [
            datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 0, 1, tzinfo=UTC),
        ]
    )
    app = create_app()
    app.dependency_overrides[current_utc_time] = lambda: next(readings)

    with TestClient(app) as fresh_client:
        first = fresh_client.get("/api/time").json()["now"]
        second = fresh_client.get("/api/time").json()["now"]

    assert first == "2026-01-01T00:00:00+00:00"
    assert second == "2026-01-01T00:00:01+00:00"


def test_get_time_now_is_within_request_window(client: TestClient):
    """With the real clock, now falls between timestamps taken around the call."""
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Read-only endpoint: POST is refused."""
    response = client.post("/api/time")

    assert response.status_code == 405
