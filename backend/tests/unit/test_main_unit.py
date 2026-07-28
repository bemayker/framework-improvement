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


def test_create_app_registers_version_route():
    """Edge case: the app registers the TEST-05 version route.

    Only FastAPI's own built-in routes (OpenAPI schema, docs, redoc) existed
    before TEST-05; this asserts the version router is now wired in without
    asserting the (now stale) claim that the app exposes no custom routes.
    """
    app = create_app()

    built_in_paths = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}
    custom_paths = _collect_route_paths(app.routes) - built_in_paths

    assert "/api/version" in custom_paths


def test_create_app_returns_independent_instances():
    """Error/robustness case: repeated calls do not share mutable state.

    Each call to create_app() must return a fresh FastAPI instance so tests
    or multiple app consumers never accidentally mutate a shared singleton.
    """
    first_app = create_app()
    second_app = create_app()

    assert first_app is not second_app
