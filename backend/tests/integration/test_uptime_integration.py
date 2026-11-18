"""Integration tests for GET /api/uptime (TEST-07).

The endpoint needs no database, so none of these tests touch one.
"""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criterion 1: 200 with exactly uptime_seconds and started_at."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0
    assert isinstance(body["started_at"], str)


def test_get_uptime_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 1: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/uptime")

    assert response.status_code == 200
    assert response.json()["uptime_seconds"] >= 0


def test_get_uptime_increases_between_calls_a_second_apart(client: TestClient):
    """Criterion 2: a real second between calls shows as larger uptime."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second > first


def test_get_uptime_started_at_is_identical_across_requests(client: TestClient):
    """Criterion 3: started_at is captured once, not recomputed per request."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: the wire value ends in +00:00 and parses as UTC."""
    started_at = client.get("/api/uptime").json()["started_at"]

    assert started_at.endswith("+00:00")
    assert datetime.fromisoformat(started_at).utcoffset() == timedelta(0)


def test_get_uptime_openapi_references_uptime_response_schema(client: TestClient):
    """Criterion 4: the 200 response is the UptimeResponse component.

    Asserts nothing about the `format` of started_at on purpose.
    """
    spec = client.get("/openapi.json").json()

    schema_ref = spec["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    assert schema_ref.endswith("/UptimeResponse")
    properties = spec["components"]["schemas"]["UptimeResponse"]["properties"]
    assert {"uptime_seconds", "started_at"} <= set(properties)


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Edge case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
