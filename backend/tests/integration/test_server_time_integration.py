"""Integration tests for GET /api/time (FEAT-1); no database is needed."""

from datetime import UTC, datetime, timedelta

from app.routers import server_time


def _patch_clock(monkeypatch, instant: datetime) -> None:
    monkeypatch.setattr(server_time, "current_utc_time", lambda: instant)


def test_get_time_returns_200_with_now_and_timezone(client):
    """Happy path: 200, exactly now and timezone, now in UTC with the Z suffix."""
    response = client.get("/api/time")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"].endswith("Z")
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_returns_different_now_for_calls_a_second_apart(client, monkeypatch):
    """Freshness: two calls a clock-second apart return different instants."""
    first_instant = datetime(2026, 10, 22, 17, 29, 35, tzinfo=UTC)
    _patch_clock(monkeypatch, first_instant)
    first = client.get("/api/time").json()["now"]
    _patch_clock(monkeypatch, first_instant + timedelta(seconds=1))
    second = client.get("/api/time").json()["now"]

    assert first != second
    assert datetime.fromisoformat(second) - datetime.fromisoformat(first) == timedelta(
        seconds=1
    )


def test_get_time_reads_the_clock_at_request_time(client):
    """Freshness: now lies between readings taken around the request."""
    before = datetime.now(UTC)
    response = client.get("/api/time")
    after = datetime.now(UTC)

    now = datetime.fromisoformat(response.json()["now"])
    assert before <= now <= after


def test_get_time_sets_cache_control_no_store(client):
    """Defect BUG-01: the exact directive, so an added max-age would fail."""
    response = client.get("/api/time")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert set(response.json()) == {"now", "timezone"}


def test_get_time_sets_cache_control_no_store_on_every_call(client, monkeypatch):
    """Local stand-in for the deployed reproduction: both calls uncached and fresh."""
    first_instant = datetime(2026, 10, 22, 17, 29, 35, tzinfo=UTC)
    _patch_clock(monkeypatch, first_instant)
    first = client.get("/api/time")
    _patch_clock(monkeypatch, first_instant + timedelta(seconds=1))
    second = client.get("/api/time")

    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"
    assert first.json()["now"] != second.json()["now"]


def test_post_time_returns_405(client):
    """Error case: the route is GET only."""
    response = client.post("/api/time")

    assert response.status_code == 405
