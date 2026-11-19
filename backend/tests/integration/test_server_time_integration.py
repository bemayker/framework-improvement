"""Integration tests for GET /api/time (FEAT-1, BUG-01); needs no database."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.routers import server_time as server_time_router


@pytest.fixture
def time_client() -> TestClient:
    """Unmanaged client (no lifespan), since this endpoint touches no database."""
    return TestClient(create_app())


def test_get_server_time_returns_now_and_utc_timezone(time_client):
    """Happy path: 200 with exactly the keys now and timezone."""
    response = time_client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_server_time_now_has_explicit_utc_offset(time_client):
    """Edge case: `now` parses to an aware datetime with a zero offset."""
    parsed = datetime.fromisoformat(time_client.get("/api/time").json()["now"])

    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)


def test_get_server_time_sets_cache_control_no_store(time_client):
    """BUG-01: the response forbids any cache from storing it."""
    response = time_client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_server_time_sets_no_store_on_every_response(time_client):
    """BUG-01: every response carries the header, not only the first."""
    first = time_client.get("/api/time")
    second = time_client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_get_server_time_computes_a_new_value_per_call(time_client, monkeypatch):
    """BUG-01: two requests return the two clock readings, not a stored copy."""
    readings = iter(
        [
            datetime(2026, 11, 19, 0, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 19, 0, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_router, "get_server_time", lambda: next(readings))

    first = time_client.get("/api/time").json()["now"]
    second = time_client.get("/api/time").json()["now"]

    assert first != second
    assert datetime.fromisoformat(second) > datetime.fromisoformat(first)


def test_post_server_time_returns_405_method_not_allowed(time_client):
    """Error case: only GET is allowed on the route."""
    response = time_client.post("/api/time")

    assert response.status_code == 405
