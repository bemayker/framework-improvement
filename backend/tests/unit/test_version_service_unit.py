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
    """Happy path: a value under the display length is returned verbatim."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert version_service.get_build_commit() == "abc1234"


def test_get_build_commit_truncates_full_sha_to_first_12_characters(monkeypatch):
    """Edge case: CI passes a 40-character sha; only its first 12 are reported."""
    sha = "81e1e8fa4bd74ad5b468f0d1aa5a2cd63e71b393"
    monkeypatch.setenv("BUILD_COMMIT", sha)

    assert version_service.get_build_commit() == sha[:12] == "81e1e8fa4bd7"


def test_get_build_commit_leaves_exactly_12_characters_unchanged(monkeypatch):
    """Boundary: a value exactly at the display length is not cut."""
    monkeypatch.setenv("BUILD_COMMIT", "0123456789ab")

    assert version_service.get_build_commit() == "0123456789ab"
    assert version_service.COMMIT_DISPLAY_LENGTH == 12


def test_get_build_commit_returns_unknown_when_unset(monkeypatch):
    """Unset path: the documented default is returned."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert version_service.get_build_commit() == "unknown"


def test_get_app_version_returns_unknown_when_distribution_not_installed(monkeypatch):
    """Error case: a missing distribution yields the sentinel, never a raise."""

    def raise_not_found(name: str) -> str:
        raise PackageNotFoundError(name)

    monkeypatch.setattr(version_service, "version", raise_not_found)

    assert version_service.get_app_version() == version_service.UNKNOWN_VERSION
