"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_now_and_timezone(client: TestClient):
    """Criterion 1: 200, exactly the two schema keys, timezone is UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_utc_with_plus_zero_offset_and_current(client: TestClient):
    """Criteria 1 and 2: parses, zero offset, ends +00:00 not Z, is current."""
    before = datetime.now(timezone.utc)
    now_text = client.get("/api/time").json()["now"]
    after = datetime.now(timezone.utc)

    parsed = datetime.fromisoformat(now_text)
    assert parsed.utcoffset() == timedelta(0)
    assert now_text.endswith("+00:00")
    assert not now_text.endswith("Z")
    assert before <= parsed <= after


def test_get_time_now_differs_across_calls_a_second_apart(client: TestClient):
    """Criterion 2: computed per request, the second call is at least 1s later."""
    first = client.get("/api/time").json()["now"]
    time.sleep(1.0)
    second = client.get("/api/time").json()["now"]

    assert first != second
    assert datetime.fromisoformat(second) - datetime.fromisoformat(first) >= timedelta(
        seconds=1
    )


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """BUG-01 criteria 1 and 2: the edge cache is told not to store the response."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "no-store"


def test_openapi_declares_server_time_response_schema(client: TestClient):
    """Criterion 3: the published schema names ServerTimeResponse and its fields."""
    document = client.get("/openapi.json").json()

    ok_response = document["paths"]["/api/time"]["get"]["responses"]["200"]
    schema = document["components"]["schemas"]["ServerTimeResponse"]

    assert ok_response["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/ServerTimeResponse"
    }
    assert schema["properties"]["now"]["type"] == "string"
    assert schema["properties"]["now"]["format"] == "date-time"
    assert set(schema["required"]) == {"now", "timezone"}


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
