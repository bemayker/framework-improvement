"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import re
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

NOW_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00$")


def test_get_time_returns_200_with_now_and_timezone(client: TestClient):
    """Criterion 1: 200 with exactly the keys now and timezone=UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_plus_00_00_offset(client: TestClient):
    """Criteria 1 and 2: now carries the exact +00:00 suffix, parses as UTC."""
    now = client.get("/api/time").json()["now"]

    assert NOW_PATTERN.match(now)
    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_now_is_current_server_time(client: TestClient):
    """Criterion 2: the real clock is read, between two bracketing timestamps."""
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_get_time_computes_now_per_request(client: TestClient, monkeypatch):
    """Criteria 2 and 4: two requests see two clock reads, not a cached value."""
    instants = iter(
        [
            datetime(2026, 11, 17, 0, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 17, 0, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr("app.routers.server_time.current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first == "2026-11-17T00:00:00.000000+00:00"
    assert second == "2026-11-17T00:00:01.000000+00:00"
    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
