"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response
cycle.

No database fixture is used: the endpoint touches no database and must
answer with DATABASE_URL unset, exactly as GET /api/version and GET
/api/echo do.
"""

import time
from datetime import datetime, timezone

from fastapi.testclient import TestClient


def test_get_uptime_returns_200_with_both_keys_and_their_types(client: TestClient):
    """Criterion 1: 200 with uptime_seconds (a number) and started_at
    (a string).
    """
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert isinstance(body["started_at"], str)


def test_get_uptime_seconds_increases_across_calls_a_second_apart(client: TestClient):
    """Criterion 2: uptime_seconds is non-negative and strictly larger on a
    second call made at least a second later.
    """
    first = client.get("/api/uptime").json()
    assert first["uptime_seconds"] >= 0.0

    time.sleep(1.05)

    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] >= 0.0
    assert second["uptime_seconds"] > first["uptime_seconds"]


def test_get_uptime_started_at_is_identical_across_calls_and_utc_iso8601(
    client: TestClient,
):
    """Criterion 3: started_at is captured once (identical across two calls
    on the same client) and is serialised in UTC with an explicit offset
    that `datetime.fromisoformat` parses correctly.
    """
    first = client.get("/api/uptime").json()
    second = client.get("/api/uptime").json()

    assert first["started_at"] == second["started_at"]
    assert first["started_at"].endswith("+00:00")

    parsed = datetime.fromisoformat(first["started_at"])
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timezone.utc.utcoffset(None)


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """The endpoint answers 200 even with no database configured: this
    feature persists nothing and reads nothing from the database.
    """
    monkeypatch.delenv("DATABASE_URL", raising=False)

    from app.main import create_app

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"uptime_seconds", "started_at"}
