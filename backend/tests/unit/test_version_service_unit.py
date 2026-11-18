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


def test_get_build_commit_returns_configured_commit_when_set(monkeypatch):
    """Set path: the configured value is what the service reports."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Unset path: the documented default is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


def test_get_build_commit_truncates_long_value_to_first_12_characters(monkeypatch):
    """A full 40-character sha is cut to its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", "3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1")

    assert version_service.get_build_commit() == "3f9c2a7b1d4e"
    assert version_service.COMMIT_LENGTH == 12


def test_get_build_commit_returns_short_value_unchanged(monkeypatch):
    """Boundary: a value of exactly 12 characters is returned whole."""
    monkeypatch.setenv("BUILD_COMMIT", "3f9c2a7b1d4e")

    assert version_service.get_build_commit() == "3f9c2a7b1d4e"
