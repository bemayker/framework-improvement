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


FULL_SHA = "3f2a9c1d4e5b6a7f8091a2b3c4d5e6f708192a3b"


def test_get_build_commit_returns_first_12_characters_of_full_sha(monkeypatch):
    """Happy path: a 40-character sha is cut to its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    assert version_service.COMMIT_LENGTH == 12
    assert version_service.get_build_commit() == "3f2a9c1d4e5b"


def test_get_build_commit_returns_short_value_unchanged(monkeypatch):
    """Edge case: values of 12 or fewer characters pass through untouched."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA[:12])
    assert version_service.get_build_commit() == FULL_SHA[:12]

    monkeypatch.setenv("BUILD_COMMIT", "abc1234")
    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Error case: no BUILD_COMMIT yields the default, never a raise."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"
