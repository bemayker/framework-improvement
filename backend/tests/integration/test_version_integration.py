"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle.

Every test that asserts the body controls BUILD_COMMIT itself, so a CI
environment that happens to set it cannot break them. Settings are read per
call, so the session `client` fixture sees the monkeypatched value.
"""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "0418677a1b2c3d4e5f60718293a4b5c6d7e8f901"


def _expected_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]


def test_get_version_returns_200_with_version_from_pyproject(client: TestClient, monkeypatch):
    """Criterion 1: the endpoint reports the real pyproject.toml version and a commit."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == _expected_version()
    assert isinstance(body["commit"], str)
    assert set(body) == {"version", "commit"}


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 1: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == _expected_version()
    assert isinstance(body["commit"], str)


def test_get_version_returns_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Criterion 4, unset path: the default commit is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_returns_commit_from_build_commit_env(client: TestClient, monkeypatch):
    """Criterion 4, set path: a 40-character sha yields its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "0418677a1b2c"}


def test_openapi_version_response_schema_declares_version_and_commit(client: TestClient):
    """Criterion 3: the Pydantic schema is visible in the OpenAPI document."""
    schema = client.get("/openapi.json").json()["components"]["schemas"]["VersionResponse"]

    assert schema["properties"]["version"]["type"] == "string"
    assert schema["properties"]["commit"]["type"] == "string"
    assert set(schema["required"]) == {"version", "commit"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
