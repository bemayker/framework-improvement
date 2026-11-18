"""Router integration tests for GET /api/time (BUG-01); no database needed."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient

# Two requests can land in the same clock tick; retry a bounded number of
# times so the freshness assertion cannot flake on a fast machine.
MAX_ATTEMPTS = 1000


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Happy path: 200, exactly the contract keys, an aware UTC `now`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)
    assert response.headers["cache-control"] == "no-store"


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """The header is read off the real response, not the module constant."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_returns_fresh_now_per_request(client: TestClient):
    """Edge case: a later request returns a later `now`, so nothing is stored."""
    first = datetime.fromisoformat(client.get("/api/time").json()["now"])

    later = first
    for _ in range(MAX_ATTEMPTS):
        later = datetime.fromisoformat(client.get("/api/time").json()["now"])
        if later > first:
            break

    assert later > first


def test_post_time_returns_method_not_allowed(client: TestClient):
    """Error case: the route answers GET only."""
    response = client.post("/api/time")

    assert response.status_code == 405
