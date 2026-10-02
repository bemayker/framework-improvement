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
    """Criterion 1: the endpoint reports the real pyproject.toml version."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_reports_commit_from_build_commit_env(
    client: TestClient, monkeypatch
):
    """Criterion 2: a set BUILD_COMMIT reaches the response, so no router literal."""
    monkeypatch.setenv("BUILD_COMMIT", "3f9c2a1b7e0d4c5a")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {
        "version": _expected_version(),
        "commit": "3f9c2a1b7e0d4c5a",
    }


def test_get_version_reports_unknown_commit_when_build_commit_is_empty(
    client: TestClient, monkeypatch
):
    """Edge case: an empty build arg still yields a non-empty commit."""
    monkeypatch.setenv("BUILD_COMMIT", "")

    assert client.get("/api/version").json()["commit"] == "unknown"


def test_get_version_body_has_exactly_string_version_and_commit(
    client: TestClient, monkeypatch
):
    """Criterion 3: the schema governs the body's key set and types."""
    monkeypatch.setenv("BUILD_COMMIT", "abc")

    body = client.get("/api/version").json()

    assert set(body) == {"version", "commit"}
    assert all(isinstance(value, str) for value in body.values())


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 3: no database connection is needed; DATABASE_URL may be absent."""
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
