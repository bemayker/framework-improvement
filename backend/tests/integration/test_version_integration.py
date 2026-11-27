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


def test_get_version_returns_200_with_version_and_commit(client: TestClient, monkeypatch):
    """Criterion 1: the endpoint reports the pyproject.toml version and a commit string."""
    monkeypatch.setenv("BUILD_COMMIT", "abc123")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "abc123"}


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 1: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_reports_commit_from_build_commit_env(client: TestClient, monkeypatch):
    """Criterion 2: a 40-character sha in BUILD_COMMIT is reported as its first 12."""
    full_sha = "3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708"
    monkeypatch.setenv("BUILD_COMMIT", full_sha)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == full_sha[:12]


def test_get_version_reports_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Criterion 2: with BUILD_COMMIT unset the response reports "unknown"."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "unknown"


def test_openapi_version_response_schema_declares_version_and_commit(client: TestClient):
    """Criterion 3: the body is the Pydantic VersionResponse, both fields required strings."""
    schema = client.get("/openapi.json").json()["components"]["schemas"]["VersionResponse"]

    assert schema["properties"]["version"]["type"] == "string"
    assert schema["properties"]["commit"]["type"] == "string"
    assert set(schema["required"]) == {"version", "commit"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
