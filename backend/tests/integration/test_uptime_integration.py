"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle.

These tests need no database and deliberately use neither the `database_url`
nor the `db_connection` fixture: the endpoint opens no connection, exactly as
the version and echo endpoints do not.
"""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_uptime_returns_200_with_the_two_documented_fields(client: TestClient):
    """Criteria 1 and 3: the exact body shape, and a UTC-offset `started_at`."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0
    assert body["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_twice_a_second_apart_grows_while_started_at_holds(
    client: TestClient,
):
    """Criteria 2 and 3, in the criterion's own words: two calls a second apart."""
    first = client.get("/api/uptime").json()
    time.sleep(1)
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] > first["uptime_seconds"]
    assert first["started_at"] == second["started_at"]


def test_openapi_declares_the_uptime_bound_and_response_schema(client: TestClient):
    """Criteria 2 and 4, from the outside: both are declared, not hand-rolled.

    A non-negative check written in the handler would never reach the OpenAPI
    document, and a bare dict response would never produce a component $ref.
    """
    schema = client.get("/openapi.json").json()

    operation = schema["paths"]["/api/uptime"]["get"]
    response_schema = operation["responses"]["200"]["content"]["application/json"][
        "schema"
    ]
    assert response_schema == {"$ref": "#/components/schemas/UptimeResponse"}

    component = schema["components"]["schemas"]["UptimeResponse"]
    assert component["properties"]["uptime_seconds"]["type"] == "number"
    assert component["properties"]["uptime_seconds"]["minimum"] == 0
    assert component["properties"]["started_at"]["type"] == "string"
    assert component["properties"]["started_at"]["format"] == "date-time"
    assert set(component["required"]) == {"uptime_seconds", "started_at"}


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """The endpoint is read-only, matching the version, health and echo precedents."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
