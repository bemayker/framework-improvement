"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas import server_time


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the regression test for the edge-cache defect."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_get_time_second_consecutive_response_also_carries_no_store(client: TestClient):
    client.get("/api/time")

    second = client.get("/api/time")

    assert second.headers["cache-control"] == "no-store"


def test_get_time_body_has_exact_keys_and_utc_offset(client: TestClient):
    body = client.get("/api/time").json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")


def test_get_time_two_requests_return_distinct_now_values(client: TestClient, monkeypatch):
    """Criterion 3 (the half the fix controls): no value is reused across requests."""
    ticks = iter(
        [
            datetime(2026, 10, 29, 12, 0, 0, tzinfo=UTC),
            datetime(2026, 10, 29, 12, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time, "_utc_now", lambda: next(ticks))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
