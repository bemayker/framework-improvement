"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle.

These tests request neither `database_url` nor `db_connection`: the uptime
endpoint needs no database, and the suite must stay runnable on a machine with
no PostgreSQL, exactly as test_echo_integration.py is.
"""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers.uptime import STARTED_AT

# Elapsed time is measured on the monotonic clock, so `started_at` plus
# `uptime_seconds` tracks the wall clock only up to any correction the wall
# clock took since startup. A few seconds is a sanity bound, not a precision
# claim (see the plan's recorded assumptions).
MAXIMUM_ACCEPTABLE_SKEW = timedelta(seconds=5)


def test_get_uptime_returns_200_with_the_two_documented_keys(client: TestClient):
    """Criterion 1: the endpoint answers 200 with exactly the two keys."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert not isinstance(body["uptime_seconds"], bool)
    assert body["uptime_seconds"] >= 0


def test_get_uptime_serialises_started_at_in_utc_with_an_explicit_offset(
    client: TestClient,
):
    """Criterion 3: `started_at` parses as an aware UTC value written `+00:00`."""
    body = client.get("/api/uptime").json()

    parsed = datetime.fromisoformat(body["started_at"])

    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)
    assert body["started_at"].endswith("+00:00")


def test_get_uptime_returns_a_larger_value_on_a_request_a_second_later(
    client: TestClient,
):
    """Criterion 2: uptime grows strictly between two calls a second apart."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert second > first


def test_get_uptime_reports_the_start_timestamp_captured_at_import(
    client: TestClient,
):
    """Criterion 3: both calls report the module constant, not a fresh clock read."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second == STARTED_AT.astimezone(timezone.utc).isoformat()


def test_get_uptime_agrees_with_the_test_processs_own_utc_clock(client: TestClient):
    """Edge case: start plus uptime lands on roughly the real UTC now."""
    body = client.get("/api/uptime").json()

    reconstructed_now = datetime.fromisoformat(body["started_at"]) + timedelta(
        seconds=body["uptime_seconds"]
    )

    assert abs(datetime.now(timezone.utc) - reconstructed_now) < MAXIMUM_ACCEPTABLE_SKEW


def test_openapi_documents_uptime_response_as_the_200_schema(client: TestClient):
    """Criterion 4: the 200 body is the pydantic model, not a bare dict."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    get_operation = schema["paths"]["/api/uptime"]["get"]
    content = get_operation["responses"]["200"]["content"]["application/json"]
    assert content["schema"]["$ref"] == "#/components/schemas/UptimeResponse"
    component = schema["components"]["schemas"]["UptimeResponse"]
    assert list(component["properties"]) == ["uptime_seconds", "started_at"]
    assert set(component["required"]) == {"uptime_seconds", "started_at"}
    assert component["properties"]["uptime_seconds"]["minimum"] == 0


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """The endpoint is read-only; any other method is FastAPI's 405."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
