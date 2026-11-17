"""Integration tests for CORS origin configuration (BUG-02), through the real middleware."""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _preflight_free_get(monkeypatch, cors_origins: str, origin: str):
    monkeypatch.setenv("CORS_ORIGINS", cors_origins)
    # Deliberately not used as a context manager: the lifespan would need a
    # database, and the CORS headers come from middleware that needs none.
    return TestClient(create_app()).get("/api/version", headers={"Origin": origin})


def test_trailing_slash_cors_origin_allows_the_browser_origin(monkeypatch):
    """Criteria 1 and 2: a configured trailing slash still matches the browser's origin."""
    response = _preflight_free_get(monkeypatch, BROWSER_ORIGIN + "/", BROWSER_ORIGIN)

    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN


def test_mixed_slash_and_slashless_cors_origins_allow_the_second_origin(monkeypatch):
    """Edge case: normalisation applies per entry in a comma-separated list."""
    response = _preflight_free_get(
        monkeypatch, "https://a.example/," + BROWSER_ORIGIN, BROWSER_ORIGIN
    )

    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN
