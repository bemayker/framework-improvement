"""Integration test for the CORS wiring (BUG-02), through the real middleware stack.

The unit tests assert what `get_settings()` returns; this asserts the
resolution: the header a browser would actually receive.
"""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def test_get_with_trailing_slash_in_cors_origins_allows_the_browser_origin(monkeypatch):
    """AC1: a configured origin with a trailing slash still matches the browser's Origin."""
    monkeypatch.setenv("CORS_ORIGINS", f"{BROWSER_ORIGIN}/")

    # No `with`: the version endpoint needs no database, so skip the lifespan.
    client = TestClient(create_app())
    response = client.get("/api/version", headers={"Origin": BROWSER_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == BROWSER_ORIGIN
