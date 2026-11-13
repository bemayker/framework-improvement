"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.services import server_time_service


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: every response tells a CDN not to cache it."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Criterion 3 (cause side): body shape with an aware UTC `now`."""
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset().total_seconds() == 0


def test_get_time_returns_fresh_now_per_request(client: TestClient, monkeypatch):
    """Criterion 3 (cause side): two requests return different `now` values."""
    moments = iter(
        [
            datetime(2026, 11, 13, 9, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 13, 9, 0, 1, tzinfo=UTC),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(moments)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
