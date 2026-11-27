"""Unit tests for the version service (backend/app/services/version_service.py)."""

from importlib.metadata import PackageNotFoundError

from app.services import version_service


def test_get_build_commit_returns_configured_commit(monkeypatch):
    """Happy path: a commit of 12 characters or fewer is returned unchanged."""
    monkeypatch.setenv("BUILD_COMMIT", "abc123")

    assert version_service.get_build_commit() == "abc123"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Edge case: with no BUILD_COMMIT the declared default is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


def test_get_build_commit_truncates_full_sha_to_twelve_characters(monkeypatch):
    """Edge case: CI's 40-character sha is cut to its first 12 characters."""
    full_sha = "3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708"
    monkeypatch.setenv("BUILD_COMMIT", full_sha)

    assert version_service.get_build_commit() == full_sha[:12] == "3f9c2ab71d04"
    assert version_service.COMMIT_DISPLAY_LENGTH == 12


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
