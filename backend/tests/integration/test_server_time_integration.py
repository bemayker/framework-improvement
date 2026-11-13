"""Integration tests for GET /api/time (BUG-01). No database needed."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.routers.server_time import CACHE_CONTROL_NO_STORE


def test_get_server_time_returns_200_with_now_and_timezone(client: TestClient) -> None:
    response = client.get("/api/time")

    assert response.status_code == 200
    assert set(response.json()) == {"now", "timezone"}
    assert response.json()["timezone"] == "UTC"


def test_get_server_time_now_has_explicit_zero_offset(client: TestClient) -> None:
    now = datetime.fromisoformat(client.get("/api/time").json()["now"])

    assert now.utcoffset() == timedelta(0)


def test_get_server_time_two_calls_return_different_now(client: TestClient) -> None:
    first = client.get("/api/time").json()["now"]
    time.sleep(0.01)
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_get_server_time_sets_cache_control_no_store(client: TestClient) -> None:
    response = client.get("/api/time")

    assert response.headers["cache-control"] == "no-store"
    assert CACHE_CONTROL_NO_STORE == "no-store"


def test_post_server_time_returns_405(client: TestClient) -> None:
    assert client.post("/api/time").status_code == 405
