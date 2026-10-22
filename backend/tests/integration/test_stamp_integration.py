"""Integration tests for GET /api/stamp (FEAT-6), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.main import create_app

# Port 9 (discard) on the loopback interface is closed, so the probe fails
# fast within its connect timeout instead of hanging the request.
UNREACHABLE_DATABASE_URL = "postgresql://tasknotes:tasknotes@127.0.0.1:9/tasknotes"


def test_get_stamp_returns_200_with_db_true_against_the_real_database(
    client: TestClient, database_url: str
):
    """Criterion 1: a reachable database answers the exact stamp body."""
    response = client.get("/api/stamp")

    assert response.status_code == 200
    assert response.json() == {"stamp": "ok", "db": True}


def test_get_stamp_returns_200_with_db_false_when_the_database_is_unreachable(
    monkeypatch,
):
    """Edge case: db is a reported fact, so the status stays 200."""
    monkeypatch.setenv("DATABASE_URL", UNREACHABLE_DATABASE_URL)

    # Deliberately not a context manager: the lifespan would run
    # ensure_schema() against the unreachable target and raise.
    unmanaged_client = TestClient(create_app())

    response = unmanaged_client.get("/api/stamp")

    assert response.status_code == 200
    assert response.json() == {"stamp": "ok", "db": False}


def test_post_stamp_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/stamp")

    assert response.status_code == 405
