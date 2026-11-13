"""Integration test for the CORS wiring in create_app() (BUG-02)."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_cors_origin_configured_with_trailing_slash_matches_the_browser_origin(monkeypatch):
    """A configured trailing slash must not block the origin a browser sends.

    Browsers send `Origin: http://localhost:5183` with no trailing slash, and
    CORSMiddleware compares strings exactly, so the configured entry has to be
    normalised for the allow-origin header to be returned at all.
    """
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")

    app = create_app()
    # Not a context manager: the lifespan would need a database, and the CORS
    # middleware under test does not.
    unmanaged_client = TestClient(app)

    response = unmanaged_client.get(
        "/api/version", headers={"Origin": "http://localhost:5183"}
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:5183"
