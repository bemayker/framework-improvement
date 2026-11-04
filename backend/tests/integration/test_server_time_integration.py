"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200 with exactly the keys now and timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_has_plus_zero_offset_and_is_current(client: TestClient):
    """Criterion 2: explicit +00:00 offset, parseable, close to the real clock."""
    before = datetime.now(timezone.utc)
    now = client.get("/api/time").json()["now"]
    after = datetime.now(timezone.utc)

    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    parsed = datetime.fromisoformat(now)
    assert parsed.utcoffset() == timedelta(0)
    assert before - timedelta(seconds=5) <= parsed <= after + timedelta(seconds=5)


def test_get_time_is_computed_per_request(client: TestClient):
    """Criterion 2: two calls a second apart return different, later values."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    time.sleep(1)
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second != first
    assert second - first >= timedelta(seconds=1)


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Edge case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
