"""Integration tests for GET /api/time (FEAT-1, BUG-01), full HTTP cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers.server_time import NO_STORE
from app.services import server_time_service


def test_get_time_returns_200_with_utc_body_and_explicit_offset(client: TestClient):
    """Criterion 1 (body): exactly `now` and `timezone`, `now` aware UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"
    assert payload["now"].endswith("+00:00")
    parsed = datetime.fromisoformat(payload["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_returns_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries `Cache-Control: no-store`."""
    response = client.get("/api/time")

    assert response.headers["Cache-Control"] == NO_STORE


def test_get_time_returns_a_fresh_value_with_the_header_on_each_request(
    client: TestClient, monkeypatch
):
    """Edge case: two requests differ and both carry the header."""
    clock_values = iter(
        [
            datetime(2026, 11, 4, 1, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 4, 1, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(clock_values))

    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.json()["now"] != second.json()["now"]
    assert first.headers["Cache-Control"] == NO_STORE
    assert second.headers["Cache-Control"] == NO_STORE


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
