"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "62be9fd76e4beeb5ec93d5fd3e9da1a35242d049"


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


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """Criterion 1: no database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_get_version_reports_build_commit_when_set(client: TestClient, monkeypatch):
    """Criterion 4, set path: a short BUILD_COMMIT is reported as is."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    assert client.get("/api/version").json()["commit"] == "abc1234"


def test_get_version_reports_unknown_commit_when_build_commit_unset(client: TestClient, monkeypatch):
    """Criterion 4, unset path: the default is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert client.get("/api/version").json()["commit"] == "unknown"


def test_get_version_reports_first_12_characters_of_build_commit_when_set(
    client: TestClient, monkeypatch
):
    """Criterion 2: a 40-character sha is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    assert client.get("/api/version").json()["commit"] == FULL_SHA[:12]


def test_openapi_version_response_schema_declares_version_and_commit(client: TestClient):
    """Criterion 3: the response model is the Pydantic schema, visible in OpenAPI."""
    spec = client.get("/openapi.json").json()

    ref = spec["paths"]["/api/version"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    assert ref.endswith("/VersionResponse")
    schema = spec["components"]["schemas"]["VersionResponse"]
    assert set(schema["properties"]) == {"version", "commit"}
    assert set(schema["required"]) == {"version", "commit"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
