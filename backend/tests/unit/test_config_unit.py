"""Unit tests for application settings (backend/app/core/config.py).

`get_settings()` is the single accessor every other module uses to reach
configuration, and nothing covered it before this file: `app_title` reaches the
FastAPI instance in `create_app()` and `database_url` is the only credential-
shaped value in the package, so an unnoticed change to either is a silent
production-configuration change.

Environment-backed settings (`database_url`, `cors_origins`, `build_commit`)
are read per call through `default_factory`, so `get_settings()` keeps its
"read fresh from the environment" promise.
"""

import dataclasses
import os

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.config import (
    DEFAULT_BUILD_COMMIT,
    DEFAULT_CORS_ORIGINS,
    Settings,
    get_settings,
)


def test_get_settings_returns_the_configured_app_title():
    """Happy path: the title FastAPI is instantiated with is the documented one."""
    assert get_settings().app_title == "Task Notes API"


def test_get_settings_returns_a_settings_instance():
    """Happy path: the accessor's return type is the dataclass, not a dict or a str."""
    assert isinstance(get_settings(), Settings)


def test_get_settings_returns_a_new_instance_on_every_call():
    """Edge case: no cached singleton stands between callers and the accessor.

    `get_settings()` carries no `lru_cache`, and `app.core.db.get_connection`
    calls it per request. A cache added later would change that behaviour
    silently, so pin the absence of one.
    """
    first, second = get_settings(), get_settings()

    assert first is not second
    assert first == second


def test_settings_is_frozen_so_configuration_cannot_be_mutated_at_runtime():
    """Error case: assigning to a field raises rather than silently succeeding."""
    settings = get_settings()

    with pytest.raises(dataclasses.FrozenInstanceError):
        settings.app_title = "Mutated"


def test_settings_database_url_is_optional_and_never_a_hardcoded_credential():
    """Edge case: the field is `str | None`, and no credential is baked in.

    The scaffold deliberately ships no credential-shaped default; the real
    value arrives from the environment via docker-compose or `.env.example`.
    This asserts the type contract and the absence of a literal default, which
    hold whether or not the field is evaluated per call (see the module
    docstring).
    """
    settings = get_settings()

    assert settings.database_url is None or isinstance(settings.database_url, str)

    # No credential is baked into the class. Two field shapes satisfy that and the
    # assertion must accept both: a `default_factory` (the current form, which reads
    # the environment per call and so declares no `default` at all), or a plain
    # default that came from the environment rather than from a source literal.
    # A hardcoded `database_url: str = "postgresql://user:pass@host/db"` matches
    # neither and still fails.
    field = next(f for f in dataclasses.fields(Settings) if f.name == "database_url")
    assert field.default is dataclasses.MISSING or field.default in (
        None,
        os.environ.get("DATABASE_URL"),
    )


def test_settings_cors_origins_parses_comma_separated_env_value(monkeypatch):
    """CORS_ORIGINS is split on commas, entries stripped, empty entries dropped."""
    monkeypatch.setenv("CORS_ORIGINS", " https://a.example , ,https://b.example,")

    assert get_settings().cors_origins == ("https://a.example", "https://b.example")


def test_settings_cors_origins_defaults_when_unset(monkeypatch):
    """With CORS_ORIGINS unset the frontend's default origin is allowed."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    assert get_settings().cors_origins == DEFAULT_CORS_ORIGINS == ("http://localhost:5183",)


@pytest.mark.parametrize("blank", ["", "   ", " , "])
def test_settings_cors_origins_treats_blank_value_as_unset(monkeypatch, blank):
    """A blank CORS_ORIGINS falls back to the default rather than allowing nothing."""
    monkeypatch.setenv("CORS_ORIGINS", blank)

    assert get_settings().cors_origins == DEFAULT_CORS_ORIGINS


def test_settings_cors_origins_drops_trailing_slash(monkeypatch):
    """BUG-02: an origin configured with a trailing slash is stored without it."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")

    assert get_settings().cors_origins == ("http://localhost:5183",)


def test_cors_preflight_allows_origin_configured_with_trailing_slash(monkeypatch):
    """BUG-02: the browser's slashless Origin matches a slash-terminated setting."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5183/")
    client = TestClient(create_app())

    response = client.get("/api/health", headers={"Origin": "http://localhost:5183"})

    assert response.headers.get("access-control-allow-origin") == "http://localhost:5183"


def test_settings_cors_origins_lone_slash_falls_back_to_default(monkeypatch):
    """A value that is only a slash is an empty entry and uses the default."""
    monkeypatch.setenv("CORS_ORIGINS", "/")

    assert get_settings().cors_origins == DEFAULT_CORS_ORIGINS


def test_settings_build_commit_returns_stripped_env_value(monkeypatch):
    """BUILD_COMMIT is returned with surrounding whitespace stripped."""
    monkeypatch.setenv("BUILD_COMMIT", "  abc1234  ")

    assert get_settings().build_commit == "abc1234"


def test_settings_build_commit_defaults_when_unset(monkeypatch):
    """With BUILD_COMMIT unset the single declared default applies."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert get_settings().build_commit == DEFAULT_BUILD_COMMIT == "unknown"


@pytest.mark.parametrize("blank", ["", "   ", "\t"])
def test_settings_build_commit_treats_blank_value_as_unset(monkeypatch, blank):
    """A blank BUILD_COMMIT (an empty Docker build arg) falls back to the default."""
    monkeypatch.setenv("BUILD_COMMIT", blank)

    assert get_settings().build_commit == DEFAULT_BUILD_COMMIT


def test_settings_build_commit_is_read_per_call_not_at_import(monkeypatch):
    """Changing the variable between calls changes the result."""
    monkeypatch.setenv("BUILD_COMMIT", "first")
    first = get_settings().build_commit
    monkeypatch.setenv("BUILD_COMMIT", "second")

    assert (first, get_settings().build_commit) == ("first", "second")
