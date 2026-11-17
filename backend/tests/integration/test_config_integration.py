"""Integration test for CORS configuration (BUG-02), full HTTP request/response cycle."""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def test_cors_origin_configured_with_trailing_slash_matches_the_browser_origin(monkeypatch):
    """Criterion 1: a trailing-slash CORS_ORIGINS entry still allows the browser's origin.

    Browsers send `Origin` without a trailing slash, and CORSMiddleware matches
    exactly, so the configured value must be normalized.
    """
    monkeypatch.setenv("CORS_ORIGINS", f"{BROWSER_ORIGIN}/")

    app = create_app()
    # Deliberately not a context manager: the lifespan runs ensure_schema(),
    # and this test needs no database.
    unmanaged_client = TestClient(app)

    response = unmanaged_client.get("/api/version", headers={"Origin": BROWSER_ORIGIN})

    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN
