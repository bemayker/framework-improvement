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


def test_get_build_commit_truncates_a_40_character_sha_to_12(monkeypatch):
    """Happy path: a full sha from CI is cut to its first 12 characters."""
    sha = "91e19ee37652a14621403c9bfdd0263de8767a5f"
    monkeypatch.setenv("BUILD_COMMIT", sha)

    assert version_service.get_build_commit() == sha[:12] == "91e19ee37652"


def test_get_build_commit_keeps_a_12_character_value_unchanged(monkeypatch):
    """Edge case: the boundary length is not cut."""
    monkeypatch.setenv("BUILD_COMMIT", "91e19ee37652")

    assert version_service.get_build_commit() == "91e19ee37652"


def test_get_build_commit_returns_a_shorter_value_unchanged(monkeypatch):
    """Edge case: a short value is reported as given, not padded."""
    monkeypatch.setenv("BUILD_COMMIT", "abc123")

    assert version_service.get_build_commit() == "abc123"


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Unset path: the default sentinel is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"
