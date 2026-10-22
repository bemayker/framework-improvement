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


def test_get_build_commit_cuts_a_full_sha_to_its_first_12_characters(monkeypatch):
    """Set path: CI passes a 40-character sha and only its prefix is reported."""
    sha = "0123456789abcdef0123456789abcdef01234567"
    monkeypatch.setenv("BUILD_COMMIT", sha)

    assert version_service.get_build_commit() == sha[:12] == "0123456789ab"


def test_get_build_commit_returns_a_12_character_value_unchanged(monkeypatch):
    """Boundary: exactly COMMIT_LENGTH characters are not cut."""
    monkeypatch.setenv("BUILD_COMMIT", "0123456789ab")

    assert version_service.COMMIT_LENGTH == 12
    assert version_service.get_build_commit() == "0123456789ab"


def test_get_build_commit_returns_a_shorter_value_unchanged(monkeypatch):
    """Edge case: a 7-character short sha is not padded or altered."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Unset path: the default passes through the cut unchanged."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"
