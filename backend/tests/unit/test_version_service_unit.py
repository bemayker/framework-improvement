"""Unit tests for the version service (backend/app/services/version_service.py)."""

from importlib.metadata import PackageNotFoundError

import pytest

from app.services import version_service

FULL_SHA = "3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345"


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


def test_get_build_commit_truncates_a_full_sha_to_12_characters(monkeypatch):
    """Set path: a 40-character sha reports only its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    assert version_service.get_build_commit() == FULL_SHA[:12]
    assert version_service.COMMIT_LENGTH == 12


@pytest.mark.parametrize("value", ["3f9c2a1b7d4e", "abc123"])
def test_get_build_commit_leaves_values_of_12_characters_or_fewer_unchanged(
    monkeypatch, value
):
    """Edge case: exactly 12 and shorter values are returned as given."""
    monkeypatch.setenv("BUILD_COMMIT", value)

    assert version_service.get_build_commit() == value


@pytest.mark.parametrize("blank", [None, "", "   "])
def test_get_build_commit_returns_unknown_when_unset_or_blank(monkeypatch, blank):
    """Unset path: no usable BUILD_COMMIT reports the sentinel."""
    if blank is None:
        monkeypatch.delenv("BUILD_COMMIT", raising=False)
    else:
        monkeypatch.setenv("BUILD_COMMIT", blank)

    assert version_service.get_build_commit() == "unknown"
