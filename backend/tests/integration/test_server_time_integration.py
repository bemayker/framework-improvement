"""Integration tests for GET /api/time (FEAT-1).

The endpoint needs no database; the lifespan skips schema set-up when
DATABASE_URL is unset, so these tests need no backing service.
"""

import time
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_exactly_now_and_timezone(client: TestClient):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_utc_with_explicit_plus_zero_offset(client: TestClient):
    now = client.get("/api/time").json()["now"]

    assert now.endswith("+00:00")
    assert not now.endswith("Z")
    assert datetime.fromisoformat(now).utcoffset() == timedelta(0)


def test_get_time_now_lies_within_the_request_window(client: TestClient):
    before = datetime.now(UTC)
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])
    after = datetime.now(UTC)

    assert before <= now <= after


def test_get_time_is_computed_per_request(client: TestClient):
    first = client.get("/api/time").json()["now"]
    time.sleep(0.01)
    second = client.get("/api/time").json()["now"]

    assert datetime.fromisoformat(second) > datetime.fromisoformat(first)


def test_get_time_response_is_the_server_time_response_schema(client: TestClient):
    schema = client.get("/openapi.json").json()
    ok = schema["paths"]["/api/time"]["get"]["responses"]["200"]

    ref = ok["content"]["application/json"]["schema"]["$ref"]
    assert ref == "#/components/schemas/ServerTimeResponse"


def test_post_time_returns_405(client: TestClient):
    assert client.post("/api/time").status_code == 405
