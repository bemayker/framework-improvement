"""Integration tests for GET /api/time over the real HTTP cycle (FEAT-1, BUG-01).

No database is involved: the endpoint is stateless.
"""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

# A real delay between the two requests, long enough that two reads of the
# clock differ on any platform, so freshness never hinges on clock resolution.
DELAY_BETWEEN_REQUESTS_SECONDS = 0.05


def test_get_time_returns_200_with_now_and_utc_timezone(client: TestClient):
    """Happy path: 200 with an aware UTC `now` and the `UTC` label."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)
    assert body["now"].endswith("+00:00")


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """BUG-01: the response tells the CDN not to store it."""
    response = client.get("/api/time")

    assert response.headers["Cache-Control"] == "no-store"


def test_get_time_returns_fresh_now_per_request(client: TestClient):
    """Edge case: two requests a short real delay apart return different `now`."""
    first = client.get("/api/time").json()["now"]
    time.sleep(DELAY_BETWEEN_REQUESTS_SECONDS)
    second = client.get("/api/time").json()["now"]

    assert first != second
    assert datetime.fromisoformat(second) > datetime.fromisoformat(first)


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: only GET is registered on /api/time."""
    response = client.post("/api/time")

    assert response.status_code == 405
