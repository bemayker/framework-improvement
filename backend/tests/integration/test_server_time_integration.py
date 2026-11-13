"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.services import server_time_service


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_utc_body_shape(client: TestClient):
    response = client.get("/api/time")

    body = response.json()
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset().total_seconds() == 0


def test_get_time_returns_fresh_now_per_request(client: TestClient, monkeypatch):
    """Criterion 3 (automated half): `now` is computed per request, not cached."""
    moments = iter(
        [
            datetime(2026, 11, 13, 15, 42, 23, tzinfo=UTC),
            datetime(2026, 11, 13, 15, 42, 24, tzinfo=UTC),
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
    response = client.post("/api/time")

    assert response.status_code == 405
