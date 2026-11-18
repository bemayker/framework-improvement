"""Integration tests for GET /api/time (FEAT-1), through the full HTTP cycle."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: 200 with exactly the keys now and timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_plus_zero_offset(client: TestClient):
    """Edge case: the exact +00:00 suffix survives FastAPI's serialisation."""
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_get_time_computes_now_per_request(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """Freshness: two requests with a clock one second apart return different values."""
    first = datetime(2026, 11, 19, 10, 0, 0, tzinfo=timezone.utc)
    instants = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "utc_now", lambda: next(instants))

    first_now = client.get("/api/time").json()["now"]
    second_now = client.get("/api/time").json()["now"]

    assert first_now == "2026-11-19T10:00:00+00:00"
    assert second_now == "2026-11-19T10:00:01+00:00"


def test_get_time_successive_calls_are_utc_and_non_decreasing(client: TestClient):
    """Edge case: with the real clock, values parse as UTC and never go backwards."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert first.utcoffset() == timedelta(0)
    assert second.utcoffset() == timedelta(0)
    assert second >= first


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: only GET is defined on the path."""
    response = client.post("/api/time")

    assert response.status_code == 405


def test_get_time_openapi_declares_server_time_response_schema(client: TestClient):
    """AC3 at the boundary: the OpenAPI 200 response references ServerTimeResponse."""
    schema = client.get("/openapi.json").json()

    ok_schema = schema["paths"]["/api/time"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert ok_schema["$ref"].endswith("/ServerTimeResponse")
