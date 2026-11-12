"""Unit tests for the version service (backend/app/services/version_service.py)."""

from importlib.metadata import PackageNotFoundError

import pytest

from app.services import version_service


def test_get_app_version_returns_installed_distribution_version(monkeypatch):
    """Happy path: the resolved metadata value is returned verbatim."""
    monkeypatch.setattr(version_service, "version", lambda name: "9.9.9")

    assert version_service.get_app_version() == "9.9.9"


def test_get_app_version_queries_the_project_distribution_name(monkeypatch):
    """Edge case: the lookup targets the pyproject.toml distribution name,
    not the `app` package name (the mistake that only fails in a real install).
    """
    queried_names: list[str] = []

    def fake_version(name: str) -> str:
        queried_names.append(name)
        return "0.1.0"

    monkeypatch.setattr(version_service, "version", fake_version)

    version_service.get_app_version()

    assert queried_names == [version_service.DISTRIBUTION_NAME]
    assert version_service.DISTRIBUTION_NAME == "task-notes-backend"


def test_get_app_version_returns_unknown_when_distribution_not_installed(monkeypatch):
    """Error case: a missing distribution yields the sentinel, never a raise."""

    def raise_not_found(name: str) -> str:
        raise PackageNotFoundError(name)

    monkeypatch.setattr(version_service, "version", raise_not_found)

    assert version_service.get_app_version() == version_service.UNKNOWN_VERSION


FULL_SHA = "3f9c2a71b0de4c5e8a9f00112233445566778899"


def test_get_build_commit_truncates_full_sha_to_first_12_characters(monkeypatch):
    """Happy path: a 40-character sha resolves to its 12-character prefix."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    assert version_service.get_build_commit() == FULL_SHA[: version_service.COMMIT_LENGTH]
    assert version_service.get_build_commit() == "3f9c2a71b0de"


def test_get_build_commit_returns_short_value_unchanged(monkeypatch):
    """Edge case: a value of 12 characters or fewer is neither padded nor altered."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Error case: no BUILD_COMMIT at all yields the declared default."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == version_service.UNKNOWN_COMMIT == "unknown"


@pytest.mark.parametrize("blank", ["", "   "])
def test_get_build_commit_returns_unknown_when_blank(monkeypatch, blank):
    """Edge case: an image built without the arg carries an empty value."""
    monkeypatch.setenv("BUILD_COMMIT", blank)

    assert version_service.get_build_commit() == version_service.UNKNOWN_COMMIT
