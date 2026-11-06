"""Integration test for BUG-02: CORS_ORIGINS with a trailing slash, through the real middleware."""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def test_origin_allowed_when_cors_origins_has_a_trailing_slash(monkeypatch):
    """Criterion 1: "http://localhost:5183/" in CORS_ORIGINS still allows the browser's Origin.

    The middleware reads settings when the app is built, so the variable is set
    before create_app(). The version endpoint needs no database, and the client
    is not used as a context manager so the database-touching lifespan never runs.
    """
    monkeypatch.setenv("CORS_ORIGINS", BROWSER_ORIGIN + "/")

    client = TestClient(create_app())
    response = client.get("/api/version", headers={"Origin": BROWSER_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN
