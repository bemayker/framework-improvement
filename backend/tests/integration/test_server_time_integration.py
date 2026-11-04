"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Shape: exactly `now` and `timezone`, with the literal UTC timezone."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_is_aware_utc_with_explicit_offset(client: TestClient):
    """Offset: `now` parses as aware UTC and the raw string ends in +00:00."""
    raw_now = client.get("/api/time").json()["now"]

    parsed = datetime.fromisoformat(raw_now)
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)
    assert raw_now.endswith("+00:00")


def test_get_time_response_carries_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response header that stops the edge cache storing it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_second_response_also_carries_cache_control_no_store(
    client: TestClient,
):
    """Edge case: the directive is on every response, not only the first."""
    client.get("/api/time")
    second = client.get("/api/time")

    assert second.headers["cache-control"] == "no-store"


def test_get_time_returns_different_now_for_successive_requests(
    client: TestClient, monkeypatch
):
    """Freshness: `now` is computed per request, with no hardcoded wait."""
    instants = iter(
        [
            datetime(2026, 11, 4, 20, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 4, 20, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time, "get_current_utc_time", lambda: next(instants))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405


def test_openapi_documents_time_response_schema(client: TestClient):
    """The 200 response references ServerTimeResponse with both required fields."""
    spec = client.get("/openapi.json").json()

    ok_schema = spec["paths"]["/api/time"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert ok_schema["$ref"].endswith("/ServerTimeResponse")
    assert set(spec["components"]["schemas"]["ServerTimeResponse"]["required"]) == {
        "now",
        "timezone",
    }
