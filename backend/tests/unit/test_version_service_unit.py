"""Unit tests for the version service (backend/app/services/version_service.py)."""

from importlib.metadata import PackageNotFoundError

from app.services import version_service

FULL_SHA = "0418677a1b2c3d4e5f60718293a4b5c6d7e8f901"


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


def test_get_build_commit_returns_env_value_when_set(monkeypatch):
    """Happy path: a BUILD_COMMIT of 12 characters or fewer is the commit."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Edge case: with BUILD_COMMIT unset the commit is the documented default."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


def test_get_build_commit_truncates_full_sha_to_12_characters(monkeypatch):
    """Edge case: a 40-character sha is cut to its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    assert version_service.get_build_commit() == FULL_SHA[:12] == "0418677a1b2c"
    assert version_service.COMMIT_MAX_LENGTH == 12


def test_get_build_commit_returns_short_value_unchanged(monkeypatch):
    """Boundary: a value of exactly 12 characters passes through untouched."""
    monkeypatch.setenv("BUILD_COMMIT", "abcdef123456")

    assert version_service.get_build_commit() == "abcdef123456"
