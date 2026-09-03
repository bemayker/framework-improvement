"""Unit tests for the echo response schema (backend/app/schemas/echo.py)."""

import pytest
from pydantic import BaseModel, ValidationError

from app.routers.echo import router as echo_router
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse

ECHO_ROUTE_PATH = "/api/echo"


def _echo_route():
    """Return the /api/echo route object off the echo router."""
    return next(
        route
        for route in echo_router.routes
        if getattr(route, "path", None) == ECHO_ROUTE_PATH
    )


def test_echo_response_serializes_echo_field_to_json_body():
    """Happy path: the model produces exactly the documented response body."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_route_declares_pydantic_schema_from_schemas_package():
    """Criterion 4: the response body is a Pydantic model in app/schemas/.

    Asserted as a structure property rather than over HTTP: the model is a
    BaseModel living in app.schemas.echo, and it is the route's declared
    response_model, so the router cannot be answering with a bare dict.
    """
    assert issubclass(EchoResponse, BaseModel)
    assert EchoResponse.__module__ == "app.schemas.echo"
    assert _echo_route().response_model is EchoResponse


def test_echo_msg_max_length_is_the_documented_bound():
    """Edge case: the bound's value is the 200 characters the contract states."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_echo_response_without_echo_field_raises_validation_error():
    """Error case: `echo` is required, so an empty construction is rejected."""
    with pytest.raises(ValidationError):
        EchoResponse()
