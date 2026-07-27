"""Unit tests for the FastAPI app factory (backend/app/main.py)."""

from app.main import create_app


def test_create_app_returns_app_with_expected_title():
    """Happy path: the app instantiates with the configured title."""
    app = create_app()

    assert app.title == "Task Notes API"


def test_create_app_registers_no_feature_routes():
    """Edge case: the scaffold app exposes no feature routes yet.

    Only FastAPI's own built-in routes (OpenAPI schema, docs, redoc) exist
    at this stage; feature endpoints are added starting with TEST-02.
    """
    app = create_app()

    built_in_paths = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}
    custom_paths = {
        route.path for route in app.routes if getattr(route, "path", None) not in built_in_paths
    }

    assert custom_paths == set()


def test_create_app_returns_independent_instances():
    """Error/robustness case: repeated calls do not share mutable state.

    Each call to create_app() must return a fresh FastAPI instance so tests
    or multiple app consumers never accidentally mutate a shared singleton.
    """
    first_app = create_app()
    second_app = create_app()

    assert first_app is not second_app
