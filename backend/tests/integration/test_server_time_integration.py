"""Integration tests for GET /api/time (BUG-01, recreating FEAT-1).

No database is needed: the route reads only the clock.
"""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_utc_now_and_timezone(client: TestClient):
    """Happy path: 200, exactly the two documented keys, an aware UTC `now`."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store(client: TestClient):
    """BUG-01 criteria 1 and 2: the response carries Cache-Control: no-store."""
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"


def test_get_time_two_requests_differ_and_both_are_no_store(client: TestClient):
    """BUG-01 criterion 3 locally: requests a second apart differ, uncached."""
    first = client.get("/api/time")
    time.sleep(1.1)
    second = client.get("/api/time")

    assert first.json()["now"] != second.json()["now"]
    assert first.headers["cache-control"] == "no-store"
    assert second.headers["cache-control"] == "no-store"


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Error case: the route is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
