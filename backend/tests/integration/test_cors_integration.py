"""Integration tests for CORS handling (BUG-02), through the real CORS middleware."""

from fastapi.testclient import TestClient

from app.core.config import DEFAULT_CORS_ORIGINS
from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _allow_origin_for(origin: str) -> str | None:
    """Return the Access-Control-Allow-Origin a GET /api/version answers with."""
    # Deliberately not used as a context manager: the lifespan would need a
    # database, and the version endpoint needs none.
    client = TestClient(create_app())
    response = client.get("/api/version", headers={"Origin": origin})
    return response.headers.get("access-control-allow-origin")


def test_cors_origin_configured_with_trailing_slash_allows_the_browser_origin(monkeypatch):
    """Criteria 1 and 2: a trailing slash in CORS_ORIGINS does not block the frontend.

    The browser sends its origin without a trailing slash.
    """
    monkeypatch.setenv("CORS_ORIGINS", BROWSER_ORIGIN + "/")

    assert _allow_origin_for(BROWSER_ORIGIN) == BROWSER_ORIGIN


def test_cors_default_origin_is_allowed_when_cors_origins_is_unset(monkeypatch):
    """Criterion 3: unset CORS_ORIGINS still allows the default origin."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    default_origin = DEFAULT_CORS_ORIGINS[0]

    assert _allow_origin_for(default_origin) == default_origin


def test_cors_default_origin_is_allowed_when_cors_origins_is_blank(monkeypatch):
    """Criterion 3: a blank CORS_ORIGINS falls back to the default origin."""
    monkeypatch.setenv("CORS_ORIGINS", "  ")
    default_origin = DEFAULT_CORS_ORIGINS[0]

    assert _allow_origin_for(default_origin) == default_origin
