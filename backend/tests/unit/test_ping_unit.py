"""Unit tests for the ping schema and router (FEAT-4)."""

import pytest
from pydantic import ValidationError

from app.routers import ping
from app.schemas.ping import PingResponse


def test_schema_dump_is_exactly_status_and_service():
    """Happy path: the JSON shape is exactly the two documented fields."""
    body = PingResponse(status="ok", service="backend").model_dump(mode="json")

    assert body == {"status": "ok", "service": "backend"}


def test_schema_rejects_status_other_than_ok():
    """Error case: only the literal ok is accepted for status."""
    with pytest.raises(ValidationError):
        PingResponse(status="down", service="backend")


def test_schema_rejects_service_other_than_backend():
    """Error case: only the literal backend is accepted for service."""
    with pytest.raises(ValidationError):
        PingResponse(status="ok", service="frontend")


def test_route_is_declared_once_for_get_only_with_schema_response_model():
    """Edge case: one /api/ping route, GET only (no POST declared)."""
    routes = [route for route in ping.router.routes if route.path == "/api/ping"]

    assert len(routes) == 1
    assert routes[0].methods == {"GET"}
    assert routes[0].response_model is PingResponse


def test_handler_returns_expected_model():
    """Happy path: calling the handler directly returns the constant body."""
    assert ping.get_ping() == PingResponse(status="ok", service="backend")
