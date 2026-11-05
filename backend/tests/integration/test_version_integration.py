"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
SHA_40 = "3f9c2a1b7d4e8f6a5c0b9d2e1f4a7c3b6d8e0f12"


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


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 3: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_returns_first_twelve_characters_of_build_commit(
    client: TestClient, monkeypatch
):
    """Criterion 2, set path: a full sha is cut to its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", SHA_40)

    response = client.get("/api/version")

    assert response.status_code == 200
    body = response.json()
    assert body["commit"] == SHA_40[:12]
    assert body["version"] == _expected_version()
    assert set(body) == {"version", "commit"}


def test_get_version_returns_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Criterion 2, unset path: the declared default is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "unknown"


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
