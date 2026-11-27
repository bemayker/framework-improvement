"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "91e19ee37652a14621403c9bfdd0263de8767a5f"


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


def test_get_version_returns_commit_from_build_commit_env(
    client: TestClient, monkeypatch
):
    """Set path: a full sha in BUILD_COMMIT is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": FULL_SHA[:12]}


def test_get_version_returns_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Unset path: with no BUILD_COMMIT the commit is "unknown"."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "unknown"


def test_openapi_declares_version_response_with_version_and_commit(
    client: TestClient,
):
    """Criterion 3: the declared response model has string version and commit."""
    document = client.get("/openapi.json").json()

    ref = document["paths"]["/api/version"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    schema = document["components"]["schemas"][ref.rsplit("/", 1)[-1]]

    assert ref.endswith("/VersionResponse")
    assert schema["properties"]["version"]["type"] == "string"
    assert schema["properties"]["commit"]["type"] == "string"


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
