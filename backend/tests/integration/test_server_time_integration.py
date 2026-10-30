"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.schemas import server_time as server_time_schema


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response forbids caching, so the CDN cannot store it."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Body contract: an aware UTC `now` and the literal timezone "UTC"."""
    response = client.get("/api/time")
    body = response.json()

    assert response.status_code == 200
    assert body["timezone"] == "UTC"
    parsed_now = datetime.fromisoformat(body["now"])
    assert parsed_now.tzinfo is not None
    assert parsed_now.utcoffset() == timedelta(0)


def test_get_time_now_differs_between_requests(client: TestClient, monkeypatch):
    """The value is computed per request: two distinct clock instants, two distinct bodies."""
    instants = iter(
        [
            datetime(2026, 10, 30, 17, 24, 13, tzinfo=UTC),
            datetime(2026, 10, 30, 17, 24, 14, tzinfo=UTC),
        ]
    )

    class StubDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return next(instants)

    monkeypatch.setattr(server_time_schema, "datetime", StubDatetime)

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
