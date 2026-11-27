"""Integration tests for the CORS wiring, observed at the HTTP entry point.

BUG-02: an origin configured with a trailing slash (`http://localhost:5183/`)
never matched the browser's slash-less `Origin` header, so no
`Access-Control-Allow-Origin` header was sent and the frontend was blocked.
`/api/version` needs no database, so these tests run without one.
"""

import httpx
from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _get_version_as(origin: str, monkeypatch, cors_origins: str | None) -> httpx.Response:
    """Build the app after the environment is set, then call /api/version."""
    if cors_origins is None:
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ORIGINS", cors_origins)
    with TestClient(create_app()) as test_client:
        return test_client.get("/api/version", headers={"Origin": origin})


def test_cors_origin_with_trailing_slash_allows_browser_origin_without_one(monkeypatch):
    """BUG-02: `http://localhost:5183/` in CORS_ORIGINS matches the browser's origin."""
    response = _get_version_as(BROWSER_ORIGIN, monkeypatch, "http://localhost:5183/")

    assert response.headers.get("access-control-allow-origin") == BROWSER_ORIGIN


def test_cors_trailing_slash_entry_among_several_allows_each_origin(monkeypatch):
    """Edge case: a slash-terminated entry beside a plain one, both matched."""
    configured = "https://other.example, http://localhost:5183/"

    other = _get_version_as("https://other.example", monkeypatch, configured)
    browser = _get_version_as(BROWSER_ORIGIN, monkeypatch, configured)

    assert other.headers.get("access-control-allow-origin") == "https://other.example"
    assert browser.headers.get("access-control-allow-origin") == BROWSER_ORIGIN


def test_cors_unset_origins_still_allows_the_default_origin(monkeypatch):
    """Unchanged behaviour: with CORS_ORIGINS unset the default origin is allowed."""
    response = _get_version_as(BROWSER_ORIGIN, monkeypatch, None)

    assert response.headers.get("access-control-allow-origin") == BROWSER_ORIGIN
