"""Unit tests for the version response schema (backend/app/schemas/version.py)."""

import pytest
from pydantic import ValidationError

from app.schemas.version import VersionResponse


def test_version_response_declares_version_and_commit_fields():
    """Both fields are declared, required, and typed as strings."""
    fields = VersionResponse.model_fields

    assert set(fields) == {"version", "commit"}
    assert all(f.annotation is str and f.is_required() for f in fields.values())
    assert VersionResponse(version="1.0.0", commit="abc").model_dump() == {
        "version": "1.0.0",
        "commit": "abc",
    }


def test_version_response_rejects_missing_commit():
    """Error case: a body without `commit` is invalid, not silently defaulted."""
    with pytest.raises(ValidationError):
        VersionResponse(version="1.0.0")
