"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.version import VersionResponse

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "0123456789abcdef0123456789abcdef01234567"


def _expected_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]


def test_get_version_returns_200_with_version_and_commit(client: TestClient, monkeypatch):
    """Criterion 1: the endpoint reports the pyproject.toml version and a commit."""
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


def test_get_version_returns_truncated_commit_when_build_commit_is_set(
    client: TestClient, monkeypatch
):
    """Criterion 2: a 40-character sha is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert response.json()["commit"] == FULL_SHA[:12]


def test_get_version_returns_unknown_commit_when_build_commit_is_unset(
    client: TestClient, monkeypatch
):
    """Criterion 4: the unset path reports the documented sentinel."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.json()["commit"] == "unknown"


def test_get_version_response_is_defined_by_version_response_schema(
    client: TestClient, monkeypatch
):
    """Criterion 3: the OpenAPI 200 response is VersionResponse and the body matches it."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    schema = client.get("/openapi.json").json()
    ok_schema = schema["paths"]["/api/version"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    body = client.get("/api/version").json()

    assert ok_schema["$ref"].endswith("/VersionResponse")
    assert set(body) == {"version", "commit"}
    assert VersionResponse.model_validate(body).commit == "abc1234"


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
