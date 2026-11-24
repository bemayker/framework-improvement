"""Integration tests for CORS origin matching (BUG-02), full HTTP request/response cycle.

A browser sends its `Origin` header without a trailing slash, and CORSMiddleware
compares it exactly against the configured origins, so a configured origin with a
trailing slash used to block the frontend silently. These tests go through the real
app and read the response header the browser reads.
"""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _allow_origin_header(monkeypatch, cors_origins: str, origin: str) -> str | None:
    """Build a fresh app for `cors_origins` and return the allow-origin header for `origin`."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("CORS_ORIGINS", cors_origins)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version", headers={"Origin": origin})

    assert response.status_code == 200
    return response.headers.get("access-control-allow-origin")


def test_cors_origin_configured_with_trailing_slash_allows_browser_origin(monkeypatch):
    """Criteria 1 and 2: `http://localhost:5183/` in CORS_ORIGINS matches the slash-less browser origin."""
    allow_origin = _allow_origin_header(monkeypatch, f"{BROWSER_ORIGIN}/", BROWSER_ORIGIN)

    assert allow_origin == BROWSER_ORIGIN


def test_cors_comma_list_with_one_trailing_slash_allows_both_origins(monkeypatch):
    """Edge case: only one entry carries a slash; both origins are still allowed."""
    configured = f"https://a.example/, {BROWSER_ORIGIN}"

    assert _allow_origin_header(monkeypatch, configured, "https://a.example") == "https://a.example"
    assert _allow_origin_header(monkeypatch, configured, BROWSER_ORIGIN) == BROWSER_ORIGIN
