"""Integration tests for GET /api/time (FEAT-1), through the HTTP cycle.

The endpoint needs no database, so only the session `client` fixture is used.
"""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_exactly_now_and_timezone(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_aware_utc_with_plus_zero_offset(client: TestClient):
    body = client.get("/api/time").json()

    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)
    assert body["now"].endswith("+00:00")
    assert not body["now"].endswith("Z")


def test_get_time_twice_returns_fresh_increasing_values(client: TestClient):
    before = datetime.now(timezone.utc)
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(timezone.utc)

    assert before <= first < second <= after


def test_post_time_returns_405(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
