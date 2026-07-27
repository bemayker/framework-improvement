"""Unit tests for the FastAPI app factory (backend/app/main.py)."""

from app.main import create_app


def test_create_app_returns_app_with_expected_title():
    """Happy path: the app instantiates with the configured title."""
    app = create_app()

    assert app.title == "Task Notes API"


def test_create_app_registers_notes_routes():
    """Edge case: TEST-03 registers the notes router.

    Read the resolved OpenAPI schema rather than walking `app.routes`
    directly: FastAPI's router now wraps included routers lazily, so the
    schema is the version-independent way to see the effective paths.
    Only the notes endpoints are registered at this stage; no other
    feature routes exist yet.
    """
    app = create_app()

    paths = set(app.openapi()["paths"].keys())

    assert paths == {"/api/notes"}


def test_create_app_returns_independent_instances():
    """Error/robustness case: repeated calls do not share mutable state.

    Each call to create_app() must return a fresh FastAPI instance so tests
    or multiple app consumers never accidentally mutate a shared singleton.
    """
    first_app = create_app()
    second_app = create_app()

    assert first_app is not second_app
