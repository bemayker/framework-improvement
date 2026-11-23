"""Integration tests for the CORS middleware wiring in `create_app()` (BUG-02).

These observe the layer the browser sees: the `Access-Control-Allow-Origin`
response header, not only the parsed settings tuple.
"""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _allow_origin_header(origin: str) -> str | None:
    """GET /api/version (needs no database) as a browser at `origin` would."""
    with TestClient(create_app()) as client:
        response = client.get("/api/version", headers={"Origin": origin})
    assert response.status_code == 200
    return response.headers.get("access-control-allow-origin")


def test_cors_origin_configured_with_trailing_slash_matches_browser_origin(monkeypatch):
    """BUG-02: `CORS_ORIGINS=http://localhost:5183/` must allow the slash-less browser Origin."""
    monkeypatch.setenv("CORS_ORIGINS", BROWSER_ORIGIN + "/")

    assert _allow_origin_header(BROWSER_ORIGIN) == BROWSER_ORIGIN


def test_cors_default_origin_is_allowed_when_cors_origins_is_unset(monkeypatch):
    """Unset CORS_ORIGINS still lets the default frontend origin through the middleware."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    assert _allow_origin_header(BROWSER_ORIGIN) == BROWSER_ORIGIN
