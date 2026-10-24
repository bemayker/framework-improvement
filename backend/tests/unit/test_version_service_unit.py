"""Unit tests for the version service (backend/app/services/version_service.py)."""

from importlib.metadata import PackageNotFoundError

import pytest

from app.core.config import Settings
from app.services import version_service

FULL_SHA = "0123456789abcdef0123456789abcdef01234567"


def _use_build_commit(monkeypatch, value: str) -> None:
    monkeypatch.setattr(version_service, "get_settings", lambda: Settings(build_commit=value))


def test_get_build_commit_cuts_a_full_sha_to_its_first_12_characters(monkeypatch):
    """Happy path: a 40-character sha is shortened to 12."""
    _use_build_commit(monkeypatch, FULL_SHA)

    assert version_service.get_build_commit() == "0123456789ab"
    assert version_service.COMMIT_LENGTH == 12


def test_get_build_commit_returns_exactly_12_characters_unchanged(monkeypatch):
    """Boundary: a value of exactly COMMIT_LENGTH is not cut."""
    _use_build_commit(monkeypatch, "0123456789ab")

    assert version_service.get_build_commit() == "0123456789ab"


@pytest.mark.parametrize("short", ["abc1234", "a"])
def test_get_build_commit_returns_a_shorter_value_unchanged(monkeypatch, short):
    """Edge case: a value under 12 characters is returned as is, not padded."""
    _use_build_commit(monkeypatch, short)

    assert version_service.get_build_commit() == short


def test_get_build_commit_returns_unknown_when_build_commit_is_unset(monkeypatch):
    """Fallback: with BUILD_COMMIT unset the settings default reaches the caller."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


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
