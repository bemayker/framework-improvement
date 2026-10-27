"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers.server_time import CACHE_CONTROL_NO_STORE


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == CACHE_CONTROL_NO_STORE == "no-store"


def test_get_time_two_consecutive_responses_carry_header_and_differ(client: TestClient):
    """Criterion 3 locally: both responses are uncacheable and their now values differ."""
    first_clock = datetime(2026, 10, 27, 21, 0, 0, tzinfo=UTC)
    clock_reads = [first_clock, first_clock + timedelta(seconds=1)]

    with patch("app.schemas.server_time.datetime") as fake_datetime:
        fake_datetime.now.side_effect = clock_reads
        first = client.get("/api/time")
        second = client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"
    assert first.json()["now"] != second.json()["now"]


def test_get_time_body_has_exactly_now_and_utc_timezone(client: TestClient):
    """Body shape: only now and timezone; now is aware with a zero UTC offset."""
    body = client.get("/api/time").json()

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("+00:00")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
