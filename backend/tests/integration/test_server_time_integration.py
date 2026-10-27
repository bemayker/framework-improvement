"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import re
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.main import create_app

NOW_FORMAT = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{6})?\+00:00$")


def test_get_time_returns_200_with_now_and_timezone(client: TestClient):
    """Criteria 1 and 2: 200, exactly the two keys, +00:00 offset, aware value."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert NOW_FORMAT.match(body["now"])
    assert body["now"].endswith("+00:00")
    assert "Z" not in body["now"]
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset().total_seconds() == 0


def test_get_time_reads_clock_per_request(client: TestClient, monkeypatch):
    """Criterion 2: a stubbed clock shows each request reads the clock afresh."""
    first = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)
    second = datetime(2026, 1, 1, 0, 0, 1, tzinfo=UTC)
    instants = iter([first, second])

    class StubDatetime:
        @staticmethod
        def now(tz):
            return next(instants)

    monkeypatch.setattr("app.routers.server_time.datetime", StubDatetime)

    first_body = client.get("/api/time").json()
    second_body = client.get("/api/time").json()

    assert first_body["now"] == "2026-01-01T00:00:00+00:00"
    assert second_body["now"] == "2026-01-01T00:00:01+00:00"


def test_get_time_now_is_bracketed_by_real_clock_and_advances(client: TestClient):
    """Criterion 2: against the real clock, now lies between before and after."""
    before = datetime.now(UTC)
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= first <= second <= after
    assert second > first


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert NOW_FORMAT.match(response.json()["now"])


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
