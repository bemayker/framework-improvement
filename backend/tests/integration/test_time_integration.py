"""Integration tests for GET /api/time (FEAT-1), full HTTP request/response cycle.

No backing service is needed: this endpoint touches no database, so these
tests use neither the `database_url` nor the `db_connection` fixture.
"""

import time
from datetime import datetime

from fastapi.testclient import TestClient


def test_get_time_returns_200_with_expected_shape(client: TestClient):
    """Criterion 1: 200 with exactly the two contractual keys."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_get_time_now_ends_with_explicit_utc_offset(client: TestClient):
    """Criterion 2 (offset half): the now value ends in the explicit +00:00
    suffix and parses to a zero UTC offset, never naive."""
    response = client.get("/api/time")

    now_value = response.json()["now"]

    assert now_value.endswith("+00:00")
    assert not now_value.endswith("Z")
    parsed = datetime.fromisoformat(now_value)
    assert parsed.tzinfo is not None
    assert parsed.utcoffset().total_seconds() == 0


def test_get_time_reports_later_value_on_second_request(client: TestClient):
    """Criterion 2 (freshness half): two requests a moment apart return
    different, increasing values."""
    first = client.get("/api/time").json()["now"]
    time.sleep(1)
    second = client.get("/api/time").json()["now"]

    assert first != second
    assert datetime.fromisoformat(second) > datetime.fromisoformat(first)


def test_post_time_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/time")

    assert response.status_code == 405
