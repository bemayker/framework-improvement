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


FULL_SHA = "ac6e44ce1a90f3b2d4e5a6b7c8d9e0f1a2b3c4d5"


def test_get_build_commit_returns_first_12_characters_of_a_40_character_sha(monkeypatch):
    """Happy path: the full sha CI passes is reported truncated."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    assert version_service.COMMIT_LENGTH == 12
    assert version_service.get_build_commit() == FULL_SHA[:12] == "ac6e44ce1a90"


def test_get_build_commit_returns_a_12_character_value_unchanged(monkeypatch):
    """Edge case: the boundary length is not cut further."""
    monkeypatch.setenv("BUILD_COMMIT", "ac6e44ce1a90")

    assert version_service.get_build_commit() == "ac6e44ce1a90"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Error case: no BUILD_COMMIT yields the sentinel, never a raise."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


def test_get_build_commit_returns_unknown_when_blank(monkeypatch):
    """Error case: a whitespace-only value is treated as unset."""
    monkeypatch.setenv("BUILD_COMMIT", "   ")

    assert version_service.get_build_commit() == "unknown"
