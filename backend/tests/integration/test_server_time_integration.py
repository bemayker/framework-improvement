"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers import server_time as server_time_router


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """The endpoint answers with exactly the contract's two keys."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_responses_carry_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: every response is marked non-cacheable, not just the first."""
    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_get_time_now_has_explicit_zero_offset(client: TestClient):
    """`now` is never naive: it parses with an explicit UTC offset."""
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_time_now_is_computed_per_request(client: TestClient, monkeypatch):
    """Criterion 3 precondition: two requests return different instants."""
    instants = iter(
        [
            datetime(2026, 11, 5, 13, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 5, 13, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_router, "get_current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """The time route must not depend on the database."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
