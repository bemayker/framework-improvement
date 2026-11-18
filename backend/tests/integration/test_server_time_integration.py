"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.routers import server_time

FIRST_INSTANT = datetime(2026, 11, 18, 0, 0, 0, tzinfo=UTC)


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criteria 1 and 2: 200, exactly now and timezone, now aware UTC ending +00:00."""
    response = client.get("/api/time")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"
    assert payload["now"].endswith("+00:00")
    assert datetime.fromisoformat(payload["now"]).utcoffset() == timedelta(0)


def test_get_time_computes_now_per_request(client: TestClient, monkeypatch):
    """Criterion 2: two requests get two clock reads, so two different values."""
    instants = iter([FIRST_INSTANT, FIRST_INSTANT + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first == "2026-11-18T00:00:00+00:00"
    assert second == "2026-11-18T00:00:01+00:00"


def test_get_time_now_falls_within_request_window(client: TestClient):
    """Criterion 2: with the real clock, now lies between the surrounding instants."""
    before = datetime.now(UTC)
    payload = client.get("/api/time").json()
    after = datetime.now(UTC)

    assert before <= datetime.fromisoformat(payload["now"]) <= after


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405


def test_get_time_openapi_declares_server_time_response(client: TestClient):
    """Criterion 3: the OpenAPI 200 response references the ServerTimeResponse schema."""
    document = client.get("/openapi.json").json()

    schema = document["paths"]["/api/time"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert schema["$ref"].endswith("/ServerTimeResponse")
