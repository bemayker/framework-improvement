"""Integration tests for GET /api/version (TEST-05, commit added in TEST-09), full HTTP cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c"


def _expected_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]


def _get_version_body(monkeypatch, build_commit: str | None) -> dict:
    """Request /api/version from a fresh app with BUILD_COMMIT set or unset."""
    if build_commit is None:
        monkeypatch.delenv("BUILD_COMMIT", raising=False)
    else:
        monkeypatch.setenv("BUILD_COMMIT", build_commit)
    with TestClient(create_app()) as fresh_client:
        response = fresh_client.get("/api/version")
    assert response.status_code == 200
    return response.json()


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


def test_get_version_returns_commit_from_build_commit_env(monkeypatch):
    """Criteria 1 and 4, set path: commit is the BUILD_COMMIT value."""
    body = _get_version_body(monkeypatch, "abc1234")

    assert body == {"version": _expected_version(), "commit": "abc1234"}


def test_get_version_returns_unknown_commit_when_build_commit_unset(monkeypatch):
    """Criterion 4, unset path: commit falls back to the default."""
    body = _get_version_body(monkeypatch, None)

    assert body["commit"] == "unknown"


def test_get_version_truncates_full_sha_commit_to_12_characters(monkeypatch):
    """Edge case: a 40-character sha is reported as its first 12 characters."""
    body = _get_version_body(monkeypatch, FULL_SHA)

    assert body["commit"] == "3f9c2a1b7d4e"
    assert len(body["commit"]) == 12


def test_openapi_version_response_declares_version_and_commit(client: TestClient):
    """Criterion 3: the Pydantic schema declares both fields as required strings."""
    schema = client.get("/openapi.json").json()["components"]["schemas"]["VersionResponse"]

    assert schema["properties"]["version"]["type"] == "string"
    assert schema["properties"]["commit"]["type"] == "string"
    assert set(schema["required"]) == {"version", "commit"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
