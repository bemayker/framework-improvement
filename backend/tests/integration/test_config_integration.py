"""Integration test for CORS origin configuration (BUG-02), observed at the HTTP layer."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_cors_origin_configured_with_trailing_slash_matches_browser_origin(monkeypatch):
    """Criteria 1 and 2: a trailing-slash CORS_ORIGINS entry still allows the browser's origin."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as client:
        response = client.get("/api/version", headers={"Origin": "http://localhost:5183"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5183"
