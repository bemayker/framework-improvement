"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient


def test_get_time_returns_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response tells any edge cache not to store it."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_now_and_utc_timezone(client: TestClient):
    """Body shape: exactly `now` and `timezone`, with timezone UTC."""
    payload = client.get("/api/time").json()

    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"


def test_get_time_returns_now_with_explicit_utc_offset(client: TestClient):
    """Edge case: `now` parses to an aware datetime with offset zero."""
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert now.utcoffset() == timedelta(0)


def test_get_time_returns_fresh_now_per_request(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    """Criterion 3 proxy: two requests return different `now` values.

    The clock is a stub advancing one second per call, so the test needs no
    sleep and does not rely on the system clock's resolution.
    """
    ticks = iter(
        [
            datetime(2026, 11, 24, 10, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 24, 10, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr("app.services.server_time_service.utc_now", lambda: next(ticks))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
