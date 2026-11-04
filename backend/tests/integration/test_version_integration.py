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


FULL_SHA = "0123456789abcdef0123456789abcdef01234567"


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


def test_get_version_reports_first_12_characters_of_build_commit(
    client: TestClient, monkeypatch
):
    """Criterion 2: a set BUILD_COMMIT reaches the response, truncated to 12.

    The client is session-scoped and created before this env change, so this
    also proves the commit is read per request rather than cached at import.
    """
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "0123456789ab"}


def test_get_version_reports_unknown_when_build_commit_is_unset(
    client: TestClient, monkeypatch
):
    """Criterion 2: with BUILD_COMMIT unset the declared default is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.json()["commit"] == "unknown"


def test_get_version_reports_unknown_when_build_commit_is_blank(
    client: TestClient, monkeypatch
):
    """Edge case: the compose passthrough `${BUILD_COMMIT:-}` sends a blank value."""
    monkeypatch.setenv("BUILD_COMMIT", "")

    response = client.get("/api/version")

    assert response.json()["commit"] == "unknown"


def test_openapi_documents_version_response_schema_with_string_version_and_commit(
    client: TestClient,
):
    """Criterion 3: the 200 response is the VersionResponse Pydantic schema."""
    spec = client.get("/openapi.json").json()

    ref = spec["paths"]["/api/version"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    schema = spec["components"]["schemas"]["VersionResponse"]

    assert ref.endswith("/VersionResponse")
    assert set(schema["required"]) == {"version", "commit"}
    assert schema["properties"]["version"]["type"] == "string"
    assert schema["properties"]["commit"]["type"] == "string"


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
