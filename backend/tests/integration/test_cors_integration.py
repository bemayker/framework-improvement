"""Integration test: a CORS origin configured with a trailing slash (BUG-02).

Browsers send `Origin` without a trailing slash, and CORSMiddleware compares it
exactly, so a configured `http://localhost:5183/` silently blocked the frontend.
This drives the real app through its middleware stack. It needs no database:
the client is not entered as a context manager, so the lifespan never runs.
"""

from fastapi.testclient import TestClient

from app.main import create_app

CONFIGURED_WITH_SLASH = "http://localhost:5183/"


def test_cors_origin_configured_with_trailing_slash_matches_browser_origin(monkeypatch):
    """The browser's slashless Origin is allowed when the entry has a trailing slash."""
    monkeypatch.setenv("CORS_ORIGINS", CONFIGURED_WITH_SLASH)
    browser_origin = CONFIGURED_WITH_SLASH.rstrip("/")

    response = TestClient(create_app()).get(
        "/api/version", headers={"Origin": browser_origin}
    )

    assert response.headers.get("access-control-allow-origin") == browser_origin
