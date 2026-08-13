"""Integration tests for GET /api/health (TEST-02), full HTTP request/response cycle."""

from fastapi.testclient import TestClient
from psycopg.conninfo import conninfo_to_dict

from app.main import create_app
from app.services.health_service import DEFAULT_POSTGRES_PORT

# Port 9 (discard) on the loopback interface is closed, so the probe fails
# fast within its connect timeout instead of hanging the request.
UNREACHABLE_DATABASE_URL = "postgresql://tasknotes:tasknotes@127.0.0.1:9/tasknotes"


def test_get_health_returns_200_ok_against_the_real_database(
    client: TestClient, database_url: str
):
    """Criterion 1: a reachable database answers 200 with status ok.

    The reported target is asserted against the connection string in use
    rather than a hardcoded host and port, so the test proves the resolution
    instead of restating a literal.
    """
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"

    conninfo = conninfo_to_dict(database_url)
    configured_port = conninfo.get("port")
    assert payload["database"]["host"] == conninfo.get("host")
    assert payload["database"]["port"] == (
        DEFAULT_POSTGRES_PORT if configured_port is None else int(configured_port)
    )


def test_get_health_returns_503_degraded_when_the_database_is_unreachable(monkeypatch):
    """Criterion 2: an unreachable database answers 503 with status degraded."""
    monkeypatch.setenv("DATABASE_URL", UNREACHABLE_DATABASE_URL)

    app = create_app()
    # Deliberately not used as a context manager: the app lifespan runs
    # ensure_schema(), which would raise against this unreachable target
    # before any request could be made. The endpoint itself needs no lifespan.
    unmanaged_client = TestClient(app)

    response = unmanaged_client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {
        "status": "degraded",
        "database": {"host": "127.0.0.1", "port": 9},
    }


def test_post_health_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only and accepts no input."""
    response = client.post("/api/health")

    assert response.status_code == 405
