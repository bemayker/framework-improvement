"""Integration tests for GET /api/time (BUG-01), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.routers import server_time as server_time_router


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: 200, exactly the keys now and timezone, now aware UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """Criteria 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_now_has_explicit_offset(client: TestClient):
    """Edge case: the serialised instant is never naive."""
    body = client.get("/api/time").json()

    assert body["now"].endswith("Z") or body["now"].endswith("+00:00")


def test_get_time_two_calls_differ_and_both_carry_no_store(
    client: TestClient, monkeypatch
):
    """Criterion 3 precondition: distinct values, each response uncacheable."""
    instants = iter(
        [
            datetime(2026, 11, 5, 18, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 5, 18, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_router, "get_current_utc_time", lambda: next(instants))

    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.json()["now"] != second.json()["now"]
    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
