"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "1f1df4f723f8d8695ff74e774b2af1c086c9cf0e"


def _expected_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]


def test_get_version_returns_200_with_version_from_pyproject(client: TestClient, monkeypatch):
    """Criterion 1: the endpoint reports the real pyproject.toml version and a commit."""
    monkeypatch.setenv("BUILD_COMMIT", "abc123")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "abc123"}


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 3: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("BUILD_COMMIT", "abc123")

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "abc123"}


def test_get_version_truncates_full_sha_commit_to_twelve_characters(
    client: TestClient, monkeypatch
):
    """Set path: a 40-character BUILD_COMMIT is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == FULL_SHA[:12]


def test_get_version_reports_unknown_commit_when_build_commit_is_unset(
    client: TestClient, monkeypatch
):
    """Unset path: with no BUILD_COMMIT the commit is "unknown"."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "unknown"


def test_get_version_body_has_exactly_the_schema_keys(client: TestClient, monkeypatch):
    """Criterion 3: the body is the VersionResponse schema, nothing more."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert set(response.json()) == {"version", "commit"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
