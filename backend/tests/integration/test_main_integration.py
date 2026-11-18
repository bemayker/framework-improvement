"""Integration tests for the CORS wiring in `create_app()` (BUG-02).

The browser sends `Origin` without a trailing slash, and Starlette's
CORSMiddleware compares it to the configured entries as exact strings, so an
entry written with a trailing slash must still allow the browser's origin.
The client is built without a `with` block: no lifespan runs, so no database
is needed.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

BROWSER_ORIGIN = "http://localhost:5183"


def _allow_origin_header(origin: str) -> str | None:
    response = TestClient(create_app()).get("/api/version", headers={"Origin": origin})
    return response.headers.get("access-control-allow-origin")


def test_cors_origin_configured_with_trailing_slash_allows_browser_origin(monkeypatch):
    """Criteria 1 and 2: `http://localhost:5183/` matches the browser's `http://localhost:5183`."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")

    assert _allow_origin_header(BROWSER_ORIGIN) == BROWSER_ORIGIN


def test_cors_origins_with_trailing_slashes_each_allow_their_browser_origin(monkeypatch):
    """Edge case: every entry of a comma-separated list is normalised."""
    monkeypatch.setenv("CORS_ORIGINS", "https://a.example/, https://b.example/")

    assert _allow_origin_header("https://a.example") == "https://a.example"
    assert _allow_origin_header("https://b.example") == "https://b.example"


@pytest.mark.parametrize("blank", [None, "", "  "])
def test_cors_blank_or_unset_origins_still_allow_the_default_origin(monkeypatch, blank):
    """Criterion 3: unset and blank values keep falling back to the default origin."""
    if blank is None:
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ORIGINS", blank)

    assert _allow_origin_header(BROWSER_ORIGIN) == BROWSER_ORIGIN
