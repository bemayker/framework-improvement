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


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 3: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_reports_build_commit_when_set(client: TestClient, monkeypatch):
    """Set path: a 40-character sha, as CI passes it, is reported as its first 12."""
    monkeypatch.setenv("BUILD_COMMIT", "3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "3f9a1c2b7d4e"


def test_get_version_reports_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Unset path: the default is reported and the body has exactly two string fields."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"version", "commit"}
    assert body["commit"] == "unknown"
    assert isinstance(body["version"], str)


def test_openapi_version_response_declares_version_and_commit(client: TestClient):
    """Criterion 3: the body is the Pydantic schema, with both fields required strings."""
    schema = client.get("/openapi.json").json()["components"]["schemas"]["VersionResponse"]

    assert schema["required"] == ["version", "commit"]
    assert schema["properties"]["version"]["type"] == "string"
    assert schema["properties"]["commit"]["type"] == "string"


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
