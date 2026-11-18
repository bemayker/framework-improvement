"""Unit test for the version response schema (TEST-09, criterion 3)."""

from app.schemas.version import VersionResponse


def test_version_response_declares_version_and_commit_as_required_strings():
    """Both fields exist, are strings and have no default."""
    fields = VersionResponse.model_fields

    assert set(fields) == {"version", "commit"}
    for name in ("version", "commit"):
        assert fields[name].annotation is str
        assert fields[name].is_required()
