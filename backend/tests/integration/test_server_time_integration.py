"""Integration tests for GET /api/time (FEAT-1, BUG-01)."""

import time
from datetime import datetime

from fastapi.testclient import TestClient

from app.main import create_app
from app.routers.server_time import CACHE_CONTROL_NO_STORE


def test_get_time_returns_200_with_now_and_timezone(client):
    """Happy path: 200 with an offset-bearing `now` and timezone UTC."""
    response = client.get("/api/time")

    assert response.status_code == 200
    body = response.json()
    assert body["timezone"] == "UTC"
    assert datetime.fromisoformat(body["now"]).utcoffset() is not None


def test_get_time_sets_cache_control_no_store(client):
    """BUG-01: the response tells caches not to store it."""
    response = client.get("/api/time")

    assert response.headers["Cache-Control"] == CACHE_CONTROL_NO_STORE
    assert response.headers["Cache-Control"] == "no-store"


def test_get_time_two_calls_return_different_now(client):
    """Edge case: successive requests are computed per request."""
    first = client.get("/api/time").json()["now"]
    time.sleep(0.01)
    second = client.get("/api/time").json()["now"]

    assert first != second


def test_get_time_answers_without_database_url(monkeypatch):
    """Edge case: the endpoint needs no database."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with TestClient(create_app()) as fresh_client:
        response = fresh_client.get("/api/time")

    assert response.status_code == 200


def test_post_time_returns_405(client):
    """Error case: only GET is allowed."""
    response = client.post("/api/time")

    assert response.status_code == 405
