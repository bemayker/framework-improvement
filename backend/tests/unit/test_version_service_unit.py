"""Unit tests for the version service (backend/app/services/version_service.py)."""

from importlib.metadata import PackageNotFoundError

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
    """Happy path: a 40-character sha reports only its first 12 characters."""
    sha = "0123456789abcdef0123456789abcdef01234567"
    monkeypatch.setenv("BUILD_COMMIT", sha)

    assert version_service.get_build_commit() == sha[:12] == "0123456789ab"
    assert version_service.COMMIT_LENGTH == 12


def test_get_build_commit_returns_a_short_value_unchanged(monkeypatch):
    """Edge case: a value of 12 characters or fewer is not altered."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")
    assert version_service.get_build_commit() == "abc1234"

    monkeypatch.setenv("BUILD_COMMIT", "0123456789ab")
    assert version_service.get_build_commit() == "0123456789ab"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Error case: with no BUILD_COMMIT the sentinel is reported, never an empty string."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"
