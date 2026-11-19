"""Unit tests for the version response schema (TEST-09, criterion 3)."""

import pytest
from pydantic import ValidationError

from app.schemas.version import VersionResponse


def test_version_response_requires_version_and_commit_strings():
    """Both fields are required strings; omitting either is rejected."""
    body = VersionResponse(version="0.1.0", commit="49c5d32dbdfb")

    assert body.model_dump() == {"version": "0.1.0", "commit": "49c5d32dbdfb"}
    with pytest.raises(ValidationError):
        VersionResponse(version="0.1.0")
    with pytest.raises(ValidationError):
        VersionResponse(commit="49c5d32dbdfb")
