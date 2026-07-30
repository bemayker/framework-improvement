"""Unit tests for the persistence plumbing (backend/app/core/db.py).

No database is opened here: `normalize_database_url` is a pure transformation
and the engine test asserts the missing-configuration guard fires first.
"""

import pytest

from app.core import db
from app.core.exceptions import ConfigurationError


@pytest.fixture(autouse=True)
def _clear_engine_cache():
    """Keep the process-wide engine cache out of these tests, and vice versa."""
    db.get_engine.cache_clear()
    db.get_session_factory.cache_clear()
    yield
    db.get_engine.cache_clear()
    db.get_session_factory.cache_clear()


def test_normalize_database_url_pins_psycopg_on_a_bare_postgres_url():
    """Happy path: the bare scheme would resolve to psycopg2, which is not installed."""
    normalized = db.normalize_database_url("postgresql://user:pw@localhost:5432/notes")

    assert normalized == "postgresql+psycopg://user:pw@localhost:5432/notes"


def test_normalize_database_url_leaves_an_explicit_driver_untouched():
    """Edge case: a URL that already names a driver must not be rewritten."""
    url = "postgresql+psycopg://user:pw@localhost:5432/notes"

    assert db.normalize_database_url(url) == url


def test_normalize_database_url_rewrites_only_the_scheme():
    """Edge case: a database name containing the scheme text is not mangled."""
    normalized = db.normalize_database_url("postgresql://localhost/postgresql")

    assert normalized == "postgresql+psycopg://localhost/postgresql"


def test_get_engine_raises_configuration_error_when_database_url_is_unset(monkeypatch):
    """Error case: a missing DATABASE_URL is a configuration error, not a crash."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(ConfigurationError):
        db.get_engine()
