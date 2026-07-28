"""Unit tests for the FastAPI app factory (backend/app/main.py)."""

from app.main import create_app


def test_create_app_returns_app_with_expected_title():
    """Happy path: the app instantiates with the configured title."""
    app = create_app()

    assert app.title == "Task Notes API"


def test_create_app_registers_notes_routes():
    """Edge case: the notes router (TEST-03) is registered on the app.

    The scaffold app (TEST-01) exposed no feature routes; TEST-03 adds the
    first ones, so this test now asserts they exist instead of asserting
    their absence. Reads the generated OpenAPI schema (static route
    introspection) rather than issuing a request, so this stays DB-free like
    every other test in this module.
    """
    app = create_app()

    operations = app.openapi()["paths"].get("/api/notes", {})

    assert "get" in operations
    assert "post" in operations


def test_create_app_returns_independent_instances():
    """Error/robustness case: repeated calls do not share mutable state.

    Each call to create_app() must return a fresh FastAPI instance so tests
    or multiple app consumers never accidentally mutate a shared singleton.
    """
    first_app = create_app()
    second_app = create_app()

    assert first_app is not second_app
