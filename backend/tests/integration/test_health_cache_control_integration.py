"""Integration tests for the Cache-Control header on GET /api/health (BUG-06)."""

from fastapi.testclient import TestClient

from app.main import create_app

# The criterion's literal value, kept local on purpose: importing the router's
# constant would fail at collection before the fix and prove nothing about the
# missing header.
EXPECTED_CACHE_CONTROL = "no-store"

# Port 9 (discard) on the loopback interface is closed, so the probe fails
# fast within its connect timeout instead of hanging the request.
UNREACHABLE_DATABASE_URL = "postgresql://tasknotes:tasknotes@127.0.0.1:9/tasknotes"


def test_get_health_ok_response_carries_cache_control_no_store(
    client: TestClient, database_url: str
):
    """Criterion 1: the 200 response carries no-store, status and body unchanged."""
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert set(payload) == {"status", "database"}
    assert response.headers.get("cache-control") == EXPECTED_CACHE_CONTROL


def test_get_health_degraded_response_carries_cache_control_no_store(monkeypatch):
    """Criterion 1: the 503 response carries no-store, status and body unchanged."""
    monkeypatch.setenv("DATABASE_URL", UNREACHABLE_DATABASE_URL)

    app = create_app()
    # Deliberately not used as a context manager: the app lifespan runs
    # ensure_schema(), which would raise against this unreachable target.
    unmanaged_client = TestClient(app)

    response = unmanaged_client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {
        "status": "degraded",
        "database": {"host": "127.0.0.1", "port": 9},
    }
    assert response.headers.get("cache-control") == EXPECTED_CACHE_CONTROL
