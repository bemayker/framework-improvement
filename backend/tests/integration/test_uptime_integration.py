"""Integration tests for GET /api/uptime (TEST-07). No database is needed."""

import time
from datetime import datetime, timedelta

from app.schemas.uptime import UptimeResponse


def test_get_uptime_returns_200_with_uptime_and_started_at(client):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_increases_between_calls_one_second_apart(client):
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert second > first


def test_get_uptime_started_at_is_stable_across_requests(client):
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second
    assert first.endswith("+00:00")


def test_get_uptime_body_matches_uptime_response_schema(client):
    response = client.get("/api/uptime")

    UptimeResponse.model_validate(response.json())
    operation = client.get("/openapi.json").json()["paths"]["/api/uptime"]["get"]
    schema_ref = operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
    assert schema_ref.endswith("/UptimeResponse")


def test_post_uptime_returns_405_method_not_allowed(client):
    response = client.post("/api/uptime")

    assert response.status_code == 405
