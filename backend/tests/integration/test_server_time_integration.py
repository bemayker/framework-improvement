"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import re
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

Z_TIMESTAMP = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z")


def test_get_server_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: status 200 and exactly the two documented keys."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_server_time_now_ends_with_z_suffix(client: TestClient):
    """Criterion 2, offset: the exact Z suffix, never +00:00."""
    now = client.get("/api/time").json()["now"]

    assert Z_TIMESTAMP.fullmatch(now)
    assert "+00:00" not in now


def test_get_server_time_now_parses_as_aware_utc(client: TestClient):
    """Criterion 2, never naive: parses with a zero UTC offset."""
    parsed = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)


def test_get_server_time_now_is_computed_per_request(client: TestClient):
    """Criterion 2, freshness: both readings fall inside the test's own window."""
    before = datetime.now(UTC)
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= first <= second <= after


def test_get_server_time_sets_cache_control_no_store(client: TestClient):
    """BUG-01 criteria 1 and 2: exactly no-store, so a widened directive fails."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
