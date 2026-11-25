"""Integration tests for CORS through the real middleware (BUG-02).

`CORSMiddleware` matches an origin exactly, so a CORS_ORIGINS entry written
with a trailing slash never equals the browser's `Origin` header. These tests
drive the assembled app, not the parsing helper, because the defect shows only
as a missing `Access-Control-Allow-Origin` response header. `/api/version`
needs no database, and the client is not used as a context manager, so the
startup schema initialisation never runs.
"""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _allow_origin_header(monkeypatch, configured: str | None) -> str | None:
    """Return the Access-Control-Allow-Origin the app sends for BROWSER_ORIGIN."""
    if configured is None:
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ORIGINS", configured)
    client = TestClient(create_app())
    response = client.get("/api/version", headers={"Origin": BROWSER_ORIGIN})
    return response.headers.get("access-control-allow-origin")


def test_cors_origin_configured_with_trailing_slash_matches_browser_origin(monkeypatch):
    """The reported defect: `http://localhost:5183/` must allow `http://localhost:5183`."""
    assert _allow_origin_header(monkeypatch, "http://localhost:5183/") == BROWSER_ORIGIN


def test_cors_default_origin_is_allowed_when_cors_origins_is_unset(monkeypatch):
    """Edge case: the unset fallback still reaches the real middleware."""
    assert _allow_origin_header(monkeypatch, None) == BROWSER_ORIGIN
