"""Integration tests for the CORS wiring in `create_app()` (BUG-02).

The app is built through its real entry point and called through
`TestClient` without the context manager, so the database lifespan never runs:
the version endpoint and the CORS middleware need no database.
"""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _allow_origin_header(monkeypatch, cors_origins: str | None) -> str | None:
    """Return the Access-Control-Allow-Origin a browser at BROWSER_ORIGIN would see."""
    if cors_origins is None:
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ORIGINS", cors_origins)
    client = TestClient(create_app())
    response = client.get("/api/version", headers={"Origin": BROWSER_ORIGIN})
    return response.headers.get("access-control-allow-origin")


def test_cors_origin_configured_with_trailing_slash_matches_browser_origin(monkeypatch):
    """BUG-02: `http://localhost:5183/` must allow the browser's `http://localhost:5183`."""
    assert _allow_origin_header(monkeypatch, "http://localhost:5183/") == BROWSER_ORIGIN


def test_cors_default_origin_is_allowed_when_cors_origins_is_unset(monkeypatch):
    """Unset CORS_ORIGINS keeps allowing the frontend's default origin."""
    assert _allow_origin_header(monkeypatch, None) == BROWSER_ORIGIN
