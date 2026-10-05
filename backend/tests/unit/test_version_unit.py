"""Unit tests for the version schema and router handler (TEST-09)."""

import pytest
from pydantic import ValidationError

from app.routers import version as version_router
from app.schemas.version import VersionResponse


def test_version_response_has_exactly_version_and_commit_fields():
    """The schema's field set is exactly the two documented keys."""
    assert set(VersionResponse.model_fields) == {"version", "commit"}


@pytest.mark.parametrize("missing", ["version", "commit"])
def test_version_response_requires_both_fields(missing):
    """Error case: omitting either field fails validation."""
    payload = {"version": "0.1.0", "commit": "abc1234"}
    del payload[missing]

    with pytest.raises(ValidationError):
        VersionResponse(**payload)


def test_get_version_handler_takes_commit_from_the_service_not_a_literal(monkeypatch):
    """The handler returns whatever the service says, proving no router literal."""
    monkeypatch.setattr(version_router, "get_app_version", lambda: "1.2.3")
    monkeypatch.setattr(version_router, "get_build_commit", lambda: "from-service")

    assert version_router.get_version() == VersionResponse(
        version="1.2.3", commit="from-service"
    )
