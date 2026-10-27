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


def test_get_build_commit_truncates_a_full_sha_to_twelve_characters(monkeypatch):
    """Happy path: CI passes 40 characters, the service returns the first 12."""
    monkeypatch.setenv("BUILD_COMMIT", "0123456789abcdef0123456789abcdef01234567")

    assert version_service.COMMIT_LENGTH == 12
    assert version_service.get_build_commit() == "0123456789ab"


@pytest.mark.parametrize("value", ["0123456789ab", "abc1234", "a"])
def test_get_build_commit_returns_values_up_to_twelve_characters_unchanged(
    monkeypatch, value
):
    """Edge case: exactly 12 characters and shorter values are not altered."""
    monkeypatch.setenv("BUILD_COMMIT", value)

    assert version_service.get_build_commit() == value


def test_get_build_commit_returns_unknown_when_unset_without_raising(monkeypatch):
    """Error-style case: no variable yields the default, never a raise."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


def test_get_build_commit_returns_unknown_when_blank(monkeypatch):
    """A blank value is treated as unset, so it is never an empty commit."""
    monkeypatch.setenv("BUILD_COMMIT", "   ")

    assert version_service.get_build_commit() == "unknown"
