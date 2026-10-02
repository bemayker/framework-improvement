"""Unit tests for application settings (backend/app/core/config.py).

`get_settings()` is the single accessor every other module uses to reach
configuration, and nothing covered it before this file: `app_title` reaches the
FastAPI instance in `create_app()` and `database_url` is the only credential-
shaped value in the package, so an unnoticed change to either is a silent
production-configuration change.

One thing is deliberately NOT asserted here, and the reason is a source defect
rather than a gap in these tests. `Settings.database_url`'s default is written
as a plain dataclass field default, so it is evaluated **once at class
definition**, while `get_settings()`'s own docstring promises a value "read
fresh from the environment". Those two cannot both be true. Asserting either
one would encode a contested contract: asserting freshness fails today, and
asserting import-time capture would pin the defect and break the moment it is
fixed. So these tests cover the part of the contract that holds either way and
the mismatch is reported instead (see the generate-tests report and PR).
"""

import dataclasses
import os

import pytest

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


def test_settings_build_commit_returns_env_value_verbatim_when_set(monkeypatch):
    """Happy path: the build-time value is reported as supplied."""
    monkeypatch.setenv("BUILD_COMMIT", "3f9c2a1b7e0d4c5a")

    assert get_settings().build_commit == "3f9c2a1b7e0d4c5a"


def test_settings_build_commit_defaults_to_unknown_when_unset(monkeypatch):
    """Edge case: an unset variable resolves to the declared default."""
    monkeypatch.delenv("BUILD_COMMIT", raising=False)

    assert get_settings().build_commit == DEFAULT_BUILD_COMMIT == "unknown"


@pytest.mark.parametrize("blank", ["", "   ", "\t\n"])
def test_settings_build_commit_treats_blank_value_as_unset(monkeypatch, blank):
    """Edge case: an unset Docker build arg arrives empty and must not leak as ''."""
    monkeypatch.setenv("BUILD_COMMIT", blank)

    assert get_settings().build_commit == DEFAULT_BUILD_COMMIT


def test_settings_build_commit_is_reread_on_every_call(monkeypatch):
    """Edge case: the value is read per call, not captured at import."""
    monkeypatch.setenv("BUILD_COMMIT", "aaa")
    first = get_settings().build_commit
    monkeypatch.setenv("BUILD_COMMIT", "bbb")

    assert (first, get_settings().build_commit) == ("aaa", "bbb")


def test_settings_cors_origins_parses_comma_separated_env_value(monkeypatch):
    """Happy path: entries are split, stripped, and blank entries dropped."""
    monkeypatch.setenv("CORS_ORIGINS", " https://a.example , ,https://b.example,")

    assert get_settings().cors_origins == ("https://a.example", "https://b.example")


def test_settings_cors_origins_defaults_when_unset(monkeypatch):
    """Edge case: an unset variable resolves to the single declared default."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    assert get_settings().cors_origins == DEFAULT_CORS_ORIGINS == ("http://localhost:5183",)


@pytest.mark.parametrize("blank", ["", "   ", " , ,"])
def test_settings_cors_origins_treats_blank_value_as_unset(monkeypatch, blank):
    """Edge case: an empty or separator-only value falls back to the default."""
    monkeypatch.setenv("CORS_ORIGINS", blank)

    assert get_settings().cors_origins == DEFAULT_CORS_ORIGINS


def test_settings_cors_origins_is_reread_on_every_call(monkeypatch):
    """Edge case: the value is read per call, not captured at import."""
    monkeypatch.setenv("CORS_ORIGINS", "https://a.example")
    first = get_settings().cors_origins
    monkeypatch.setenv("CORS_ORIGINS", "https://b.example")

    assert (first, get_settings().cors_origins) == (
        ("https://a.example",),
        ("https://b.example",),
    )


def test_settings_build_commit_declares_no_literal_default():
    """Error case guard: the field uses a factory, so no commit literal is baked in."""
    field = next(f for f in dataclasses.fields(Settings) if f.name == "build_commit")

    assert field.default is dataclasses.MISSING
    assert field.default_factory is not dataclasses.MISSING
