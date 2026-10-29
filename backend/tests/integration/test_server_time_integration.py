"""Integration tests for GET /api/time (FEAT-1), full HTTP cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_utc_offset_and_shape(client: TestClient):
    before = datetime.now(timezone.utc)
    response = client.get("/api/time")
    after = datetime.now(timezone.utc)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)
    assert before <= parsed <= after


def test_get_time_two_calls_a_second_apart_differ(client: TestClient):
    first = client.get("/api/time").json()["now"]
    time.sleep(1.1)
    second = client.get("/api/time").json()["now"]

    assert first != second
    assert datetime.fromisoformat(second) > datetime.fromisoformat(first)


def test_post_time_returns_405(client: TestClient):
    assert client.post("/api/time").status_code == 405
