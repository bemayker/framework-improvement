"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle.

No database fixture is used: the endpoint touches no database and must
answer with DATABASE_URL unset, exactly as GET /api/version and
GET /api/echo do.
"""

from datetime import datetime

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_exactly_now_and_timezone_keys(client: TestClient):
    """Criterion 1: the endpoint returns 200 with exactly the two keys."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_the_pinned_plus_zero_offset_suffix(
    client: TestClient,
):
    """Criterion 2: `now` is serialised with the exact +00:00 suffix, never Z."""
    response = client.get("/api/time")

    assert response.json()["now"].endswith("+00:00")


def test_get_time_now_parses_with_a_zero_offset_tzinfo_never_naive(
    client: TestClient,
):
    """Criterion 2: the wire value is never naive; it parses with tzinfo set."""
    response = client.get("/api/time")

    parsed = datetime.fromisoformat(response.json()["now"])

    assert parsed.tzinfo is not None
    assert parsed.utcoffset().total_seconds() == 0


def test_get_time_two_sequential_calls_return_strictly_increasing_instants(
    client: TestClient,
):
    """Criterion 2: `now` is computed per request, not cached at import time.

    No sleep is needed: `isoformat()` carries microseconds and a full
    TestClient round trip is many orders of magnitude longer than one
    microsecond, so strict comparison is enough to observe freshness.
    """
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert second > first


def test_get_time_answers_when_database_url_is_unset(monkeypatch):
    """No database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    from app.main import create_app

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200
    assert response.json()["timezone"] == "UTC"
