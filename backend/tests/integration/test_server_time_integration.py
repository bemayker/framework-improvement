"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers.server_time import utc_now


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Criterion 1: 200, exactly now and timezone, now is a current aware time."""
    before = datetime.now(timezone.utc)

    response = client.get("/api/time")

    after = datetime.now(timezone.utc)
    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.tzinfo is not None
    # The serialized value is truncated to whole seconds, so allow one second below.
    assert before - timedelta(seconds=1) <= parsed <= after


def test_get_time_now_ends_with_plus_zero_offset(client: TestClient):
    """Criterion 2: the exact suffix is +00:00, not Z, and the offset is zero."""
    body = client.get("/api/time").json()

    assert body["now"].endswith("+00:00")
    assert not body["now"].endswith("Z")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_computes_now_per_request():
    """Criterion 2: the clock is read on every request, not at import or startup."""
    readings = iter(
        [
            datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 1, 1, 0, 0, 1, tzinfo=timezone.utc),
        ]
    )
    app = create_app()
    app.dependency_overrides[utc_now] = lambda: next(readings)

    with TestClient(app) as fresh_client:
        first = fresh_client.get("/api/time").json()["now"]
        second = fresh_client.get("/api/time").json()["now"]

    assert first == "2026-01-01T00:00:00+00:00"
    assert second == "2026-01-01T00:00:01+00:00"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
