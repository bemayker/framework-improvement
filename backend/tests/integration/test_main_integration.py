"""Integration tests for the CORS wiring in create_app() (BUG-02)."""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def test_cors_allows_origin_configured_with_trailing_slash(monkeypatch):
    """A slashed CORS_ORIGINS entry still earns the browser's slashless Origin an ACAO header."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")

    # No context manager: the lifespan (and so the database) is never started.
    response = TestClient(create_app()).get("/api/version", headers={"Origin": BROWSER_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN
