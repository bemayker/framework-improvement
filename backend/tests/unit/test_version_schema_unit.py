"""Unit tests for the version response schema (TEST-09, criterion 3)."""

import pytest
from pydantic import BaseModel, ValidationError

from app.schemas.version import VersionResponse


def test_version_response_is_a_pydantic_model_in_schemas():
    """The response body is a Pydantic model living in app.schemas."""
    assert issubclass(VersionResponse, BaseModel)
    assert VersionResponse.__module__ == "app.schemas.version"


def test_version_response_requires_version_and_commit_strings():
    """Both fields are declared as required strings."""
    fields = VersionResponse.model_fields

    assert set(fields) == {"version", "commit"}
    assert all(fields[name].annotation is str for name in fields)
    assert all(fields[name].is_required() for name in fields)

    with pytest.raises(ValidationError):
        VersionResponse(version="1.0.0")
