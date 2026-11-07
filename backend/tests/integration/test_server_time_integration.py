"""Integration tests for GET /api/time (BUG-01). No database needed."""

from datetime import datetime, timedelta, timezone

from app.routers import server_time as server_time_router


def test_get_time_returns_200_with_body_shape(client):
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client):
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_computes_now_per_request(client, monkeypatch):
    # The clock is stubbed with distinct values so this cannot flake on two
    # fast in-process calls landing on the same clock reading.
    values = iter(
        [
            datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 1, 1, 12, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_router, "get_current_utc_time", lambda: next(values))

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405(client):
    response = client.post("/api/time")

    assert response.status_code == 405


def test_get_version_does_not_carry_no_store(client):
    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.headers.get("cache-control") != "no-store"
