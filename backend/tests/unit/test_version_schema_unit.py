"""Unit tests for the version response schema (TEST-09)."""

import pytest
from pydantic import ValidationError

from app.schemas.version import VersionResponse


def test_version_response_declares_version_and_commit_fields():
    """Criterion 3: the schema declares both fields as required strings."""
    fields = VersionResponse.model_fields

    assert set(fields) == {"version", "commit"}
    assert fields["version"].annotation is str and fields["version"].is_required()
    assert fields["commit"].annotation is str and fields["commit"].is_required()


def test_version_response_rejects_missing_commit():
    """Criterion 3: a body without `commit` is invalid, there is no silent default."""
    with pytest.raises(ValidationError):
        VersionResponse(version="0.1.0")
