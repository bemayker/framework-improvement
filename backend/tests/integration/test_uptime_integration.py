"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criterion 1: 200 with exactly the two documented keys."""
    response = client.get("/api/uptime")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], int | float)
    assert body["uptime_seconds"] >= 0
    assert datetime.fromisoformat(body["started_at"]).tzinfo is not None


def test_get_uptime_increases_between_calls_a_second_apart(client: TestClient):
    """Criterion 2: uptime grows with real elapsed time."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert second - first >= 0.9


def test_get_uptime_started_at_is_stable_across_requests(client: TestClient):
    """Criterion 3: started_at is captured once, not recomputed per request."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second
    assert first == client.app.state.uptime_start.started_at.isoformat()


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: UTC with an explicit +00:00 offset, in the past."""
    started_at = client.get("/api/uptime").json()["started_at"]
    after = datetime.now(UTC)

    parsed = datetime.fromisoformat(started_at)
    assert started_at.endswith("+00:00")
    assert parsed.utcoffset().total_seconds() == 0
    assert parsed <= after


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """Edge case: no database is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405


def test_openapi_documents_uptime_response_schema(client: TestClient):
    """Criterion 4: the response body is the UptimeResponse schema."""
    document = client.get("/openapi.json").json()

    ref = document["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    assert ref.endswith("/UptimeResponse")
    properties = document["components"]["schemas"]["UptimeResponse"]["properties"]
    assert {"uptime_seconds", "started_at"} <= set(properties)
