"""Integration tests for CORS origin configuration (BUG-02), through the HTTP entry point."""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def test_trailing_slash_origin_allows_browser_origin(monkeypatch):
    """Criteria 1 and 2: an origin configured with a trailing slash matches the
    browser's slash-less Origin header, so the CORS allow header is returned."""
    monkeypatch.setenv("CORS_ORIGINS", f"{BROWSER_ORIGIN}/")

    app = create_app()
    # Deliberately not used as a context manager: the lifespan runs
    # ensure_schema(), which needs a database; /api/version needs none.
    unmanaged_client = TestClient(app)

    response = unmanaged_client.get("/api/version", headers={"Origin": BROWSER_ORIGIN})

    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN


def test_unset_cors_origins_still_allows_the_default_browser_origin(monkeypatch):
    """Criterion 3: with CORS_ORIGINS unset the default origin is still allowed."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    unmanaged_client = TestClient(create_app())

    response = unmanaged_client.get("/api/version", headers={"Origin": BROWSER_ORIGIN})

    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN
