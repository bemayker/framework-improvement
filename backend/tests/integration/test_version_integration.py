"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""

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
    """Criterion 1: the endpoint reports the real pyproject.toml version and a commit."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_returns_commit_from_build_commit_env(client: TestClient, monkeypatch):
    """Criterion 1 and 2: a short BUILD_COMMIT is returned unchanged."""
    monkeypatch.setenv("BUILD_COMMIT", "abc123")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "abc123"}


def test_get_version_returns_truncated_commit_for_full_sha(client: TestClient, monkeypatch):
    """Criterion 2: a 40-character sha is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", "283fc31296537221cbdef4aedabbd59d0237dc95")

    response = client.get("/api/version")

    assert response.json()["commit"] == "283fc3129653"


def test_get_version_returns_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Criterion 4: the unset path yields the documented default."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.json()["commit"] == "unknown"


def test_openapi_version_response_schema_has_version_and_commit(client: TestClient):
    """Criterion 3: the body is defined by a schema exposing both string fields."""
    schema = client.get("/openapi.json").json()["components"]["schemas"]["VersionResponse"]

    assert schema["properties"]["version"]["type"] == "string"
    assert schema["properties"]["commit"]["type"] == "string"
    assert set(schema["required"]) == {"version", "commit"}


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
