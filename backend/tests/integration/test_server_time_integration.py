"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import re
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers.server_time import utc_now

NOW_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?\+00:00$")


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: status 200, exactly the keys now and timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_exact_plus_zero_offset(client: TestClient):
    """Criterion 2: explicit +00:00 offset, never Z and never naive."""
    now = client.get("/api/time").json()["now"]

    assert NOW_PATTERN.match(now)
    assert not now.endswith("Z")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_computes_now_per_request_with_overridden_clock():
    """Criterion 2: two requests one second apart return two values one second apart."""
    first = datetime(2026, 11, 2, 15, 50, 5, tzinfo=UTC)
    instants = iter([first, first + timedelta(seconds=1)])
    app = create_app()
    app.dependency_overrides[utc_now] = lambda: next(instants)

    with TestClient(app) as fresh_client:
        first_now = fresh_client.get("/api/time").json()["now"]
        second_now = fresh_client.get("/api/time").json()["now"]

    assert first_now != second_now
    assert datetime.fromisoformat(second_now) - datetime.fromisoformat(first_now) == timedelta(
        seconds=1
    )


def test_get_time_now_lies_between_real_clock_readings_around_request(client: TestClient):
    """Criterion 2: with the real clock, now is not frozen at import or startup."""
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
