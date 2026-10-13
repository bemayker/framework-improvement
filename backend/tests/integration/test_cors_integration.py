"""Integration test for CORS origin matching (BUG-02), full HTTP request/response cycle.

Reproduces the defect: `CORS_ORIGINS=http://localhost:5183/` (trailing slash) never
matched the browser's `Origin: http://localhost:5183`, so no
`Access-Control-Allow-Origin` header came back and the browser blocked the call.
`/api/version` needs no database, so a fresh app is enough.
"""

from fastapi.testclient import TestClient

from app.main import create_app


def test_cors_origin_configured_with_trailing_slash_matches_browser_origin(monkeypatch):
    """Criteria 1 and 2: a trailing-slash origin allows the slash-less browser Origin."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version", headers={"Origin": "http://localhost:5183"})

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5183"
