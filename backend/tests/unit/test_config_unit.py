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

from app.core.config import Settings, get_settings


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

    # No credential is baked into the class: whatever the field's default is, it
    # came from the environment rather than from a literal in the source.
    field = next(f for f in dataclasses.fields(Settings) if f.name == "database_url")
    assert field.default in (None, os.environ.get("DATABASE_URL"))
