"""Unit tests for the version response schema (backend/app/schemas/version.py, TEST-09)."""

import pytest
from pydantic import ValidationError

from app.schemas.version import VersionResponse


def test_version_response_requires_version_and_commit_strings():
    """Happy path: both fields are carried as strings."""
    response = VersionResponse(version="1.2.3", commit="abc1234")

    assert response.model_dump() == {"version": "1.2.3", "commit": "abc1234"}


def test_version_response_rejects_missing_commit():
    """Error case: a body without `commit` does not validate."""
    with pytest.raises(ValidationError):
        VersionResponse(version="1.2.3")
