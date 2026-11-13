"""Unit tests for the version response schema (backend/app/schemas/version.py)."""

import pytest
from pydantic import ValidationError

from app.schemas.version import VersionResponse


def test_version_response_declares_version_and_commit_fields():
    """Both fields are declared, required strings."""
    fields = VersionResponse.model_fields

    assert set(fields) == {"version", "commit"}
    assert all(f.is_required() and f.annotation is str for f in fields.values())


def test_version_response_rejects_missing_commit():
    """Error case: a payload without `commit` is invalid."""
    with pytest.raises(ValidationError):
        VersionResponse(version="0.1.0")
