"""Integration tests for the CORS wiring in create_app() (BUG-02), full HTTP cycle."""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _get_version_from_origin(origin: str) -> TestClient:
    # Deliberately not used as a context manager: the app lifespan runs the
    # database schema step, and /api/version needs no database.
    return TestClient(create_app()).get("/api/version", headers={"Origin": origin})


def test_cors_origin_configured_with_trailing_slash_allows_the_browser_origin(monkeypatch):
    """Criterion 1: the browser sends no trailing slash, so the configured slash must not block it."""
    monkeypatch.setenv("CORS_ORIGINS", f"{BROWSER_ORIGIN}/")

    response = _get_version_from_origin(BROWSER_ORIGIN)

    assert response.headers.get("access-control-allow-origin") == BROWSER_ORIGIN


def test_cors_origin_unset_still_allows_the_default_origin(monkeypatch):
    """Criterion 3: with CORS_ORIGINS unset the default origin is still allowed."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    response = _get_version_from_origin(BROWSER_ORIGIN)

    assert response.headers.get("access-control-allow-origin") == BROWSER_ORIGIN
