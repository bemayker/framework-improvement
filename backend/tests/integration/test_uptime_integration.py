"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_both_fields(client: TestClient):
    """Criterion 1: 200 with exactly uptime_seconds (number) and started_at (string)."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], float)
    assert isinstance(body["started_at"], str)


def test_get_uptime_is_non_negative_and_does_not_decrease(client: TestClient):
    """Criterion 2: uptime is never negative and the second reading is not smaller."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second >= first


def test_get_uptime_started_at_is_identical_across_calls_and_ends_in_utc_offset(
    client: TestClient,
):
    """Criterion 3: started_at is captured once and serialised with +00:00."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second
    assert first.endswith("+00:00")


def test_get_uptime_started_at_lies_within_fresh_app_startup(monkeypatch):
    """Criterion 3: the start is taken at application startup, not at import or per request."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    before = datetime.now(timezone.utc)
    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")
    after = datetime.now(timezone.utc)

    started_at = datetime.fromisoformat(response.json()["started_at"])
    assert before <= started_at <= after


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
