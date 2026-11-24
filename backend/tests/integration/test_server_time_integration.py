"""Router integration tests for GET /api/time (FEAT-1, BUG-01)."""

from datetime import UTC, datetime, timedelta

from app.services import server_time_service


def test_get_time_sets_cache_control_no_store(client):
    """BUG-01: the response forbids caching so an edge cache cannot serve it."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_200_with_utc_now_and_timezone(client):
    """Happy path: 200, exactly now and timezone, now aware with offset zero."""
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_computes_now_per_request(client, monkeypatch):
    """Two requests return two different `now` values, each with the header."""
    ticks = iter(
        [
            datetime(2026, 11, 24, 20, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 24, 20, 0, 1, tzinfo=UTC),
        ]
    )
    monkeypatch.setattr(server_time_service, "get_server_time", lambda: next(ticks))

    first = client.get("/api/time")
    second = client.get("/api/time")

    assert first.json()["now"] != second.json()["now"]
    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client):
    """Error case: only GET is allowed on /api/time."""
    response = client.post("/api/time")

    assert response.status_code == 405
