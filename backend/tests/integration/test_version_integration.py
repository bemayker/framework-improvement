"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""

import tomllib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

PYPROJECT_PATH = Path(__file__).resolve().parents[2] / "pyproject.toml"
FULL_SHA = "81e1e8fa4bd74ad5b468f0d1aa5a2cd63e71b393"


def _expected_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]


@pytest.fixture(autouse=True)
def pinned_build_commit(monkeypatch):
    """Pin the commit so exact-body assertions do not depend on the runner's environment."""
    monkeypatch.setenv("BUILD_COMMIT", "abc1234")


def test_get_version_returns_200_with_version_from_pyproject(client: TestClient):
    """Criteria 1 and 3: 200 with exactly the schema's two fields."""
    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "abc1234"}


def test_get_version_answers_when_database_url_is_unset(monkeypatch):
    """No database connection is needed; DATABASE_URL may be absent."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    app = create_app()
    with TestClient(app) as fresh_client:
        response = fresh_client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "abc1234"}


def test_get_version_returns_first_12_characters_of_full_sha(monkeypatch, client: TestClient):
    """Criterion 2, set path: a 40-character sha in the environment yields 12."""
    monkeypatch.setenv("BUILD_COMMIT", FULL_SHA)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": FULL_SHA[:12]}


def test_get_version_returns_unknown_commit_when_build_commit_unset(
    monkeypatch, client: TestClient
):
    """Criterion 2, unset path: no BUILD_COMMIT yields the documented default."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    response = client.get("/api/version")

    assert response.status_code == 200
    assert response.json() == {"version": _expected_version(), "commit": "unknown"}


def test_post_version_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint accepts no input and is read-only."""
    response = client.post("/api/version")

    assert response.status_code == 405
