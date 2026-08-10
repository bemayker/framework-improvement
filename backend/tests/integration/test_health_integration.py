"""Integration tests for GET /api/health (TEST-02), full HTTP request/response cycle."""

import socket

from fastapi.testclient import TestClient

from app.main import create_app


def _unused_port() -> int:
    """Return a port with nothing listening on it.

    Bind-then-release rather than a hardcoded number: the integration tier must
    not assume any particular port is free on the machine running it.
    """
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def test_get_health_returns_200_ok_when_database_is_reachable(
    client: TestClient, database_url: str
):
    """Criterion 1: against the real database the endpoint reports 200 ok.

    The `database_url` fixture gates this on a real instance being configured
    (skipping locally, failing in CI, per backend/tests/conftest.py).
    """
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {"status": "ok"}


def test_get_health_returns_503_degraded_when_database_is_unreachable(monkeypatch):
    """Criterion 2: a real refused connection produces 503 degraded over HTTP."""
    monkeypatch.setenv(
        "DATABASE_URL", f"postgresql://127.0.0.1:{_unused_port()}/postgres"
    )

    # No `with` on the client on purpose: running the app lifespan would attempt
    # the notes schema initialisation against this deliberately dead URL, which
    # is startup behaviour this test is not about.
    response = TestClient(create_app()).get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"status": "degraded"}


def test_post_health_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/health")

    assert response.status_code == 405
