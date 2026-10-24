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


FULL_SHA = "9a6bfd7c3e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b"


def test_get_build_commit_returns_short_value_unchanged(monkeypatch):
    """Happy path: a value under 12 characters is returned as is."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_returns_exactly_12_characters_unchanged(monkeypatch):
    """Edge case: the boundary length is not cut."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA[:12])

    assert version_service.get_build_commit() == FULL_SHA[:12]


def test_get_build_commit_cuts_longer_value_to_first_12_characters(monkeypatch):
    """Edge case: a full 40-character sha yields its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    assert version_service.get_build_commit() == "9a6bfd7c3e1f"
    assert version_service.COMMIT_LENGTH == 12


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Error case: an unset variable yields the sentinel, never a raise."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == version_service.UNKNOWN_COMMIT == "unknown"


def test_get_build_commit_returns_unknown_when_blank(monkeypatch):
    """Error case: a whitespace-only variable is treated as unset."""
    monkeypatch.setenv("BUILD_COMMIT", "   ")

    assert version_service.get_build_commit() == "unknown"


def test_get_app_version_returns_unknown_when_distribution_not_installed(monkeypatch):
    """Error case: a missing distribution yields the sentinel, never a raise."""

    def raise_not_found(name: str) -> str:
        raise PackageNotFoundError(name)

    monkeypatch.setattr(version_service, "version", raise_not_found)

    assert version_service.get_app_version() == version_service.UNKNOWN_VERSION
