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


def test_get_build_commit_returns_short_value_unchanged(monkeypatch):
    """Set path: a value under the limit is returned as is."""
    monkeypatch.setenv("BUILD_COMMIT", "abc123")

    assert version_service.get_build_commit() == "abc123"


def test_get_build_commit_returns_exactly_twelve_characters_unchanged(monkeypatch):
    """Edge case: the boundary value is not truncated."""
    monkeypatch.setenv("BUILD_COMMIT", "a" * version_service.COMMIT_LENGTH)

    assert version_service.get_build_commit() == "a" * 12


def test_get_build_commit_truncates_full_sha_to_twelve_characters(monkeypatch):
    """Set path: a 40-character sha (what CI passes) yields its first 12 characters."""
    sha = "1f1df4f723f8d8695ff74e774b2af1c086c9cf0e"
    monkeypatch.setenv("BUILD_COMMIT", sha)

    assert version_service.get_build_commit() == sha[:12] == "1f1df4f723f8"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Unset path: the default sentinel is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"
