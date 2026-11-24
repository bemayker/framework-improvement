"""Integration tests for GET /api/version (TEST-05, commit added in TEST-09), full HTTP cycle."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.version import VersionResponse

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "4e631128d7285ec47eb354795bf120878553505b"


def _expected_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]


def test_get_version_returns_200_with_version_and_commit(client: TestClient, monkeypatch):
    """Criterion 1: 200 with the real pyproject.toml version and a string commit."""
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


def test_get_version_reports_commit_from_build_commit_env(client: TestClient, monkeypatch):
    """Criterion 4 (set path): a short BUILD_COMMIT is reported unchanged."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "abc1234"


def test_get_version_reports_unknown_commit_when_build_commit_unset(
    client: TestClient, monkeypatch
):
    """Criterion 4 (unset path): without BUILD_COMMIT the commit is "unknown"."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == "unknown"


def test_get_version_truncates_full_sha_commit_to_12_characters(
    client: TestClient, monkeypatch
):
    """Criterion 2: a full 40-character sha is reported as its first 12 characters."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json()["commit"] == FULL_SHA[:12] == "4e631128d728"


def test_get_version_response_validates_against_version_response_schema(
    client: TestClient, monkeypatch
):
    """Criterion 3: the body parses as VersionResponse, which declares both fields."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    body = client.get("/api/version").json()

    parsed = VersionResponse.model_validate(body)
    assert parsed.commit == FULL_SHA[:12]
    assert set(VersionResponse.model_fields) == {"version", "commit"}
    assert set(body) == {"version", "commit"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
