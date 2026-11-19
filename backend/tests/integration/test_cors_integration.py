"""Integration test for the CORS wiring (BUG-02).

CORSMiddleware matches `Origin` by exact string, and a browser never sends a
trailing slash. This drives the real middleware stack through `create_app()`,
so it covers the whole path from the environment variable to the response
header the browser actually reads. The client is not used as a context manager:
that would run the lifespan, which needs a database this test does not.
"""

from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _allow_origin_header(monkeypatch, configured: str, origin: str) -> str | None:
    monkeypatch.setenv("CORS_ORIGINS", configured)
    response = TestClient(create_app()).get("/api/version", headers={"Origin": origin})
    return response.headers.get("access-control-allow-origin")


def test_cors_origin_configured_with_trailing_slash_allows_the_browser_origin(monkeypatch):
    """BUG-02: `CORS_ORIGINS=http://localhost:5183/` must allow `Origin: http://localhost:5183`."""
    header = _allow_origin_header(monkeypatch, BROWSER_ORIGIN + "/", BROWSER_ORIGIN)

    assert header == BROWSER_ORIGIN


def test_cors_origin_configured_without_trailing_slash_still_allows_the_browser_origin(monkeypatch):
    """Edge case: the already-correct form keeps working."""
    header = _allow_origin_header(monkeypatch, BROWSER_ORIGIN, BROWSER_ORIGIN)

    assert header == BROWSER_ORIGIN


def test_cors_origin_not_in_the_configured_list_is_not_allowed(monkeypatch):
    """Error case: normalising must not turn the allow-list into a wildcard."""
    header = _allow_origin_header(monkeypatch, BROWSER_ORIGIN + "/", "http://evil.example")

    assert header is None
