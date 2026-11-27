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


def test_get_version_returns_200_with_version_from_pyproject(client: TestClient, monkeypatch):
    """Criterion 1: the endpoint reports the real pyproject.toml version."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_returns_200_with_version_and_commit_strings(client: TestClient):
    """Criterion 1: both body fields are strings."""
    response = client.get("/api/version")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"version", "commit"}
    assert isinstance(body["version"], str)
    assert isinstance(body["commit"], str)


def test_get_version_returns_commit_from_build_commit_env(client: TestClient, monkeypatch):
    """Criterion 4: the set path reports the configured commit."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "abc1234"


def test_get_version_returns_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Criterion 4: the unset path reports the documented default."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "unknown"


def test_get_version_returns_first_12_characters_of_full_sha_commit(
    client: TestClient, monkeypatch
):
    """Criterion 2: a 40-character sha is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", "0123456789abcdef0123456789abcdef01234567")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "0123456789ab"


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """No database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
