"""Integration tests for GET /api/uptime (TEST-07), full HTTP cycle."""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_exact_keys(client: TestClient):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    assert set(response.json()) == {"uptime_seconds", "started_at"}


def test_get_uptime_field_types_and_utc_offset(client: TestClient):
    body = client.get("/api/uptime").json()

    assert isinstance(body["uptime_seconds"], int | float)
    assert not isinstance(body["uptime_seconds"], bool)
    assert body["uptime_seconds"] >= 0
    assert body["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(body["started_at"]).utcoffset() == timedelta(0)


def test_get_uptime_started_at_is_stable_while_uptime_increases(client: TestClient):
    first = client.get("/api/uptime").json()
    time.sleep(0.05)
    second = client.get("/api/uptime").json()

    assert first["started_at"] == second["started_at"]
    assert second["uptime_seconds"] > first["uptime_seconds"]


def test_get_uptime_answers_without_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with TestClient(create_app()) as isolated_client:
        response = isolated_client.get("/api/uptime")

    assert response.status_code == 200


def test_post_uptime_returns_405(client: TestClient):
    response = client.post("/api/uptime")

    assert response.status_code == 405
