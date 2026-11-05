"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time

TOLERANCE = timedelta(seconds=5)


def test_get_time_returns_200_with_utc_now_and_plus_zero_offset(client: TestClient):
    """Criterion 1 and 2: 200, exact shape, exact +00:00 suffix, current time."""
    before = datetime.now(UTC)

    response = client.get("/api/time")

    after = datetime.now(UTC)
    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)
    assert before - TOLERANCE <= parsed <= after + TOLERANCE


def test_get_time_computes_now_per_request(client: TestClient, monkeypatch):
    """Criterion 2: two requests a second apart return those two instants."""
    first = datetime(2026, 11, 5, 1, 29, 16, tzinfo=UTC)
    instants = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "utc_now", lambda: next(instants))

    first_body = client.get("/api/time").json()
    second_body = client.get("/api/time").json()

    assert first_body["now"] == "2026-11-05T01:29:16.000000+00:00"
    assert second_body["now"] == "2026-11-05T01:29:17.000000+00:00"


def test_get_time_with_real_clock_returns_a_later_now_on_the_second_call(client: TestClient):
    """Criterion 2: with the real clock the second `now` is strictly later."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
