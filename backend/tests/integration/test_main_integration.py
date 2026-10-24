"""Integration test for the CORS wiring in create_app() (BUG-02)."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_cors_origin_configured_with_trailing_slash_matches_browser_origin(monkeypatch):
    """BUG-02: a configured trailing slash must not block the slash-less browser Origin."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as test_client:
        response = test_client.get(
            "/api/version", headers={"Origin": "http://localhost:5183"}
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5183"
