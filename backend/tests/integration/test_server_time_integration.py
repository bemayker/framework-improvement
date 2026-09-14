"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle.

These tests request neither `database_url` nor `db_connection`: the server
time endpoint needs no database, and the suite must stay runnable on a machine
with no PostgreSQL, exactly as test_echo_integration.py is.
"""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

MAXIMUM_ACCEPTABLE_SKEW = timedelta(seconds=5)


def test_get_time_returns_200_with_the_now_and_timezone_keys(client: TestClient):
    """Criterion 1: the endpoint answers 200 with exactly the two keys."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_serialises_now_in_utc_with_an_explicit_offset(client: TestClient):
    """Criterion 2: `now` parses as an aware UTC value written as `+00:00`."""
    body = client.get("/api/time").json()

    parsed = datetime.fromisoformat(body["now"])

    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)
    assert body["now"].endswith("+00:00")


def test_get_time_returns_a_later_timestamp_on_a_request_a_second_later(
    client: TestClient,
):
    """Criterion 2: the clock is read per request, so two calls differ."""
    first = client.get("/api/time").json()["now"]
    time.sleep(1)
    second = client.get("/api/time").json()["now"]

    assert datetime.fromisoformat(second) > datetime.fromisoformat(first)


def test_get_time_agrees_with_the_test_processs_own_utc_clock(client: TestClient):
    """Edge case: the reported time is the real UTC now, not a fixed value."""
    body = client.get("/api/time").json()

    skew = abs(datetime.now(timezone.utc) - datetime.fromisoformat(body["now"]))

    assert skew < MAXIMUM_ACCEPTABLE_SKEW


def test_openapi_documents_server_time_response_as_the_200_schema(client: TestClient):
    """Criterion 3: the 200 body is the pydantic model, not a bare dict."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    get_operation = schema["paths"]["/api/time"]["get"]
    content = get_operation["responses"]["200"]["content"]["application/json"]
    assert content["schema"]["$ref"] == "#/components/schemas/ServerTimeResponse"
    assert list(
        schema["components"]["schemas"]["ServerTimeResponse"]["properties"]
    ) == ["now", "timezone"]


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """The endpoint is read-only; any other method is FastAPI's 405."""
    response = client.post("/api/time")

    assert response.status_code == 405
