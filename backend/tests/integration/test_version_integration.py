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


def test_get_version_reports_first_12_characters_of_a_40_character_build_commit(
    client: TestClient, monkeypatch
):
    """Set path: a full sha in BUILD_COMMIT is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", "0123456789abcdef0123456789abcdef01234567")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "0123456789ab"


def test_get_version_reports_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Unset path: the declared default is reported."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert client.get("/api/version").json()["commit"] == "unknown"


def test_get_version_reports_unknown_commit_when_build_commit_blank(
    client: TestClient, monkeypatch
):
    """Blank path: whitespace-only counts as unset."""
    monkeypatch.setenv("BUILD_COMMIT", "   ")

    assert client.get("/api/version").json()["commit"] == "unknown"


def test_get_version_body_has_exactly_version_and_commit_keys(client: TestClient):
    """Criterion 1: no extra keys in the body."""
    assert set(client.get("/api/version").json()) == {"version", "commit"}


def test_openapi_version_response_requires_version_and_commit_strings(client: TestClient):
    """Criterion 3: the Pydantic schema is the published response component."""
    component = client.get("/openapi.json").json()["components"]["schemas"]["VersionResponse"]

    assert sorted(component["required"]) == ["commit", "version"]
    assert component["properties"]["version"]["type"] == "string"
    assert component["properties"]["commit"]["type"] == "string"


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
