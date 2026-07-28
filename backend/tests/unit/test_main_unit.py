"""Unit tests for the FastAPI app factory (backend/app/main.py)."""

from app.main import create_app


def _collect_route_paths(routes) -> set[str]:
    """Flatten an app's route list into path strings.

    The installed FastAPI represents `app.include_router(...)` as a wrapper
    object (no `.path` of its own) holding an `original_router` whose own
    `.routes` carry the real paths, rather than flattening included routes
    directly onto `app.routes`. Recurse through that wrapper so this test
    keeps working regardless of which of the two shapes is in play.
    """
    paths: set[str] = set()
    for route in routes:
        path = getattr(route, "path", None)
        if path is not None:
            paths.add(path)
            continue
        original_router = getattr(route, "original_router", None)
        if original_router is not None:
            paths.update(_collect_route_paths(original_router.routes))
    return paths


def test_create_app_returns_app_with_expected_title():
    """Happy path: the app instantiates with the configured title."""
    app = create_app()

    assert app.title == "Task Notes API"


def test_create_app_registers_feature_routes():
    """Edge case: every feature router the factory should wire in is present.

    Only FastAPI's own built-in routes (OpenAPI schema, docs, redoc) existed
    before TEST-05 added /api/version and TEST-03 added /api/notes. Asserting on
    the set of custom paths keeps this test honest as further routers land,
    rather than asserting the (long stale) claim that there are no custom routes.
    """
    app = create_app()

    built_in_paths = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}
    custom_paths = _collect_route_paths(app.routes) - built_in_paths

    assert "/api/version" in custom_paths
    assert "/api/notes" in custom_paths


def test_create_app_returns_independent_instances():
    """Error/robustness case: repeated calls do not share mutable state.

    Each call to create_app() must return a fresh FastAPI instance so tests
    or multiple app consumers never accidentally mutate a shared singleton.
    """
    first_app = create_app()
    second_app = create_app()

    assert first_app is not second_app
