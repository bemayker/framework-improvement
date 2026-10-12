"""Integration tests for GET /api/time (FEAT-1).

The endpoint needs no database, so these tests deliberately do not request the
`database_url` fixture.
"""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_exactly_the_two_keys(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_utc_with_z_suffix_and_current(client: TestClient):
    before = datetime.now(timezone.utc)
    body = client.get("/api/time").json()
    after = datetime.now(timezone.utc)

    assert body["now"].endswith("Z")
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)
    assert before <= parsed <= after


def test_get_time_differs_between_calls_a_second_apart(client: TestClient):
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])
    time.sleep(1)
    second = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert (second - first).total_seconds() >= 0.9


def test_openapi_documents_the_server_time_response_schema(client: TestClient):
    spec = client.get("/openapi.json").json()

    ref = spec["paths"]["/api/time"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    assert ref.endswith("/ServerTimeResponse")
    now = spec["components"]["schemas"]["ServerTimeResponse"]["properties"]["now"]
    assert now["format"] == "date-time"


def test_post_time_returns_405(client: TestClient):
    response = client.post("/api/time")

    assert response.status_code == 405
