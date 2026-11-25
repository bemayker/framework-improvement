"""Integration tests for GET /api/uptime over the full HTTP cycle (TEST-07).

The endpoint needs no database, so these use the shared `client` fixture only.
"""

import time


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client):
    """Happy path: 200 with exactly the two documented keys and types."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0
    assert isinstance(body["started_at"], str)


def test_post_uptime_returns_405_method_not_allowed(client):
    """Error case: the endpoint is read-only."""
    assert client.post("/api/uptime").status_code == 405


def test_get_uptime_seconds_increases_between_calls_one_second_apart(client):
    """A real one-second gap shows up as growth in uptime_seconds."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert second > first
    assert second - first >= 0.9


def test_get_uptime_started_at_is_identical_across_requests(client):
    """Capture-once: started_at does not change between requests."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_has_explicit_utc_offset(client):
    """The wire format ends in +00:00 rather than Z."""
    started_at = client.get("/api/uptime").json()["started_at"]

    assert started_at.endswith("+00:00")
