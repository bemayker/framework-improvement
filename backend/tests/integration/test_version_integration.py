"""Integration tests for GET /api/version (TEST-05), full HTTP request/response cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"


def _expected_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]


def test_get_version_returns_200_with_version_from_pyproject(
    client: TestClient, monkeypatch
):
    """Criterion 1: the endpoint reports the real pyproject.toml version and a commit."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 3: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_returns_first_twelve_characters_of_a_set_build_commit(
    client: TestClient, monkeypatch
):
    """Criteria 2 and 5: a 40-character sha from BUILD_COMMIT is cut to 12."""
    monkeypatch.setenv("BUILD_COMMIT", "0123456789abcdef0123456789abcdef01234567")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "0123456789ab"}


def test_get_version_returns_a_short_build_commit_unchanged(
    client: TestClient, monkeypatch
):
    """Criterion 2: a value of 12 characters or fewer is reported as given."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert client.get("/api/version").json()["commit"] == "abc1234"


def test_get_version_returns_unknown_commit_when_build_commit_is_unset(
    client: TestClient, monkeypatch
):
    """Criteria 2 and 4: the unset path reports the "unknown" default."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "unknown"


def test_get_version_returns_unknown_commit_when_build_commit_is_blank(
    client: TestClient, monkeypatch
):
    """Edge case: compose passes a blank value when the host has none."""
    monkeypatch.setenv("BUILD_COMMIT", "  ")

    assert client.get("/api/version").json()["commit"] == "unknown"


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
