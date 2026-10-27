"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle.

Each test builds a fresh app with DATABASE_URL unset, so no database is needed.
"""

import time
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def uptime_app(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    return create_app()


def test_get_uptime_returns_200_with_two_typed_keys(uptime_app):
    """Criterion 1: 200 with exactly uptime_seconds (number) and started_at (string)."""
    with TestClient(uptime_app) as client:
        response = client.get("/api/uptime")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], int | float)
    assert not isinstance(body["uptime_seconds"], bool)
    assert body["uptime_seconds"] >= 0
    assert isinstance(body["started_at"], str)


def test_get_uptime_increases_between_calls_a_second_apart(uptime_app):
    """Criterion 2: uptime grows by about a second between two real requests."""
    with TestClient(uptime_app) as client:
        first = client.get("/api/uptime").json()
        time.sleep(1.0)
        second = client.get("/api/uptime").json()

    assert first["uptime_seconds"] >= 0
    assert second["uptime_seconds"] - first["uptime_seconds"] >= 0.9


def test_get_uptime_started_at_is_captured_once_at_startup(uptime_app):
    """Criterion 3: identical across requests, +00:00, within the startup window."""
    before_startup = datetime.now(UTC)
    with TestClient(uptime_app) as client:
        before_first_request = datetime.now(UTC)
        first = client.get("/api/uptime").json()
        time.sleep(0.05)
        second = client.get("/api/uptime").json()

    assert first["started_at"] == second["started_at"]
    assert first["started_at"].endswith("+00:00")
    started_at = datetime.fromisoformat(first["started_at"])
    assert before_startup <= started_at <= before_first_request


def test_restarted_app_reports_a_later_started_at(monkeypatch):
    """Criterion 3 edge: a second separately started app has a later started_at."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with TestClient(create_app()) as first_client:
        first = first_client.get("/api/uptime").json()
    time.sleep(0.01)
    with TestClient(create_app()) as second_client:
        second = second_client.get("/api/uptime").json()

    assert datetime.fromisoformat(second["started_at"]) > datetime.fromisoformat(
        first["started_at"]
    )


def test_openapi_documents_uptime_response_schema(uptime_app):
    """Criterion 4: the 200 response references the UptimeResponse component."""
    with TestClient(uptime_app) as client:
        schema = client.get("/openapi.json").json()

    ok_response = schema["paths"]["/api/uptime"]["get"]["responses"]["200"]
    ref = ok_response["content"]["application/json"]["schema"]["$ref"]
    assert ref.endswith("/UptimeResponse")
    assert "UptimeResponse" in schema["components"]["schemas"]


def test_post_uptime_returns_405_method_not_allowed(uptime_app):
    """Error case: the endpoint is read-only."""
    with TestClient(uptime_app) as client:
        response = client.post("/api/uptime")

    assert response.status_code == 405
