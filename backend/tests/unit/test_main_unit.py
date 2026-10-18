"""Unit tests for the FastAPI app factory (backend/app/main.py)."""

from app.main import create_app
from app.schemas.echo import EchoResponse
from app.schemas.server_time import ServerTimeResponse
from app.schemas.uptime import UptimeResponse

# FastAPI's own routes, present on every app regardless of what this project
# registers; subtracted so a test asserts only the app's custom routes.
BUILT_IN_ROUTE_PATHS = {"/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}


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

    custom_paths = _collect_route_paths(app.routes) - BUILT_IN_ROUTE_PATHS

    assert "/api/version" in custom_paths


def test_create_app_registers_health_route():
    """Edge case: the app registers the TEST-02 health route."""
    app = create_app()

    custom_paths = _collect_route_paths(app.routes) - BUILT_IN_ROUTE_PATHS

    assert "/api/health" in custom_paths


def _find_route(routes, path: str):
    """Return the route with this path, walking `original_router` wrappers."""
    for route in routes:
        if getattr(route, "path", None) == path:
            return route
        original_router = getattr(route, "original_router", None)
        if original_router is not None:
            found = _find_route(original_router.routes, path)
            if found is not None:
                return found
    return None


def test_create_app_registers_echo_route_with_echo_response_model():
    """Edge case: the TEST-06 echo route is wired in and declares its schema."""
    app = create_app()

    custom_paths = _collect_route_paths(app.routes) - BUILT_IN_ROUTE_PATHS
    echo_route = _find_route(app.routes, "/api/echo")

    assert "/api/echo" in custom_paths
    assert echo_route is not None
    assert echo_route.response_model is EchoResponse


def test_create_app_registers_uptime_route_with_uptime_response_model():
    """Criterion 4: the TEST-07 uptime route is wired in and declares its schema."""
    app = create_app()

    custom_paths = _collect_route_paths(app.routes) - BUILT_IN_ROUTE_PATHS
    uptime_route = _find_route(app.routes, "/api/uptime")

    assert "/api/uptime" in custom_paths
    assert uptime_route is not None
    assert uptime_route.response_model is UptimeResponse


def test_create_app_registers_time_route_with_server_time_response_model():
    """FEAT-1: the server time route is wired in and declares its schema."""
    app = create_app()

    custom_paths = _collect_route_paths(app.routes) - BUILT_IN_ROUTE_PATHS
    time_route = _find_route(app.routes, "/api/time")

    assert "/api/time" in custom_paths
    assert time_route is not None
    assert time_route.response_model is ServerTimeResponse


def test_create_app_returns_independent_instances():
    """Error/robustness case: repeated calls do not share mutable state.

    Each call to create_app() must return a fresh FastAPI instance so tests
    or multiple app consumers never accidentally mutate a shared singleton.
    """
    first_app = create_app()
    second_app = create_app()

    assert first_app is not second_app
