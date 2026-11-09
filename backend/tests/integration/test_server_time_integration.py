"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import re
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app

NOW_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?\+00:00$")


def test_get_time_returns_200_with_now_and_timezone(client: TestClient):
    """Criterion 1: 200 with exactly now and timezone, timezone UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 2: now carries an explicit +00:00 offset and parses as aware."""
    now = client.get("/api/time").json()["now"]

    assert NOW_PATTERN.match(now)
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_now_is_computed_per_request(client: TestClient):
    """Criterion 2: each value lies in its own request bracket, so none is cached."""
    brackets = []
    for _ in range(2):
        before = datetime.now(UTC)
        now = datetime.fromisoformat(client.get("/api/time").json()["now"])
        after = datetime.now(UTC)
        brackets.append((before, now, after))

    (first_before, first_now, first_after), (_, second_now, second_after) = brackets
    assert first_before <= first_now <= first_after
    assert first_after <= second_now <= second_after


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """No database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.json()["timezone"] == "UTC"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
