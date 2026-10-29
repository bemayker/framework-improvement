"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas import server_time


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries Cache-Control: no-store exactly."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "no-store"


def test_get_time_returns_aware_utc_now_and_timezone(client: TestClient):
    """Happy path: body shape, UTC label and an aware zero-offset timestamp."""
    body = client.get("/api/time").json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_returns_different_now_on_consecutive_calls(
    client: TestClient, monkeypatch
):
    """Criterion 3 (local proxy): now is computed per request, not cached."""
    start = datetime(2026, 10, 29, 19, 0, 0, tzinfo=UTC)
    moments = iter([start, start + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "_utc_now", lambda: next(moments))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
