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


def test_get_build_commit_returns_short_value_unchanged(monkeypatch):
    """Happy path: a value of 12 or fewer characters comes back as is."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_truncates_a_full_sha_to_twelve_characters(monkeypatch):
    """Edge case: CI passes a 40-character sha; only the first 12 are reported."""
    full_sha = "3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c"
    monkeypatch.setenv("BUILD_COMMIT", full_sha)

    assert version_service.BUILD_COMMIT_LENGTH == 12
    assert version_service.get_build_commit() == full_sha[:12] == "3f9c2a1b7d4e"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Error case: no BUILD_COMMIT yields the sentinel, never a raise."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


def test_get_app_version_returns_unknown_when_distribution_not_installed(monkeypatch):
    """Error case: a missing distribution yields the sentinel, never a raise."""

    def raise_not_found(name: str) -> str:
        raise PackageNotFoundError(name)

    monkeypatch.setattr(version_service, "version", raise_not_found)

    assert version_service.get_app_version() == version_service.UNKNOWN_VERSION
