"""Integration tests for GET /api/time through the real HTTP cycle."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_body_shape(client: TestClient):
    """Happy path: 200, `now` with an explicit UTC offset, timezone UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """BUG-01 criterion 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_scopes_no_store_to_the_time_route(client: TestClient):
    """Edge case: another route does not receive the directive."""
    response = client.get("/api/version")

    assert response.headers.get("cache-control") != "no-store"


def test_get_time_returns_different_now_on_consecutive_requests(client: TestClient):
    """Local freshness proxy for criterion 3: the value is not frozen."""
    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_post_time_returns_405(client: TestClient):
    """Error case: only GET is declared on the route."""
    response = client.post("/api/time")

    assert response.status_code == 405
