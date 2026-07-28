"""Unit tests for the settings module (backend/app/core/config.py).

Both branching pure functions here are load-bearing: `sqlalchemy_url` decides
which driver the whole data layer uses (psycopg 3 is installed, psycopg2 is
not), and `_read_cors_origins` decides whether the browser can call the API at
all. Environment variables are patched per test, so nothing leaks between them.
"""

from app.core.config import DEFAULT_CORS_ORIGINS, get_settings


def test_sqlalchemy_url_normalises_the_plain_postgres_scheme_to_psycopg(monkeypatch):
    """Happy path: a plain postgresql:// URL gains the explicit psycopg driver."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pw@localhost:5432/tasknotes")

    assert (
        get_settings().sqlalchemy_url
        == "postgresql+psycopg://user:pw@localhost:5432/tasknotes"
    )


def test_sqlalchemy_url_passes_through_a_url_that_already_names_a_driver(monkeypatch):
    """Edge case: an explicit driver is respected rather than doubled up."""
    monkeypatch.setenv(
        "DATABASE_URL", "postgresql+psycopg://user:pw@localhost:5432/tasknotes"
    )

    assert (
        get_settings().sqlalchemy_url
        == "postgresql+psycopg://user:pw@localhost:5432/tasknotes"
    )


def test_sqlalchemy_url_returns_none_when_database_url_is_unset(monkeypatch):
    """Error case: no configured database yields None, never a malformed URL.

    `app.main.lifespan` and the integration fixtures branch on exactly this, so
    a raise here would break every database-free unit test run.
    """
    monkeypatch.delenv("DATABASE_URL", raising=False)

    assert get_settings().sqlalchemy_url is None


def test_get_settings_reads_the_environment_on_every_call(monkeypatch):
    """Edge case: settings are not frozen at import time.

    A dataclass field default would be evaluated once at class creation; the
    module uses default_factory to avoid that, and this asserts the difference.
    """
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pw@localhost:5432/first")
    assert get_settings().database_url.endswith("/first")

    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pw@localhost:5432/second")
    assert get_settings().database_url.endswith("/second")


def test_cors_origins_falls_back_to_the_dev_default_when_unset(monkeypatch):
    """Happy path: an unset CORS_ORIGINS keeps the Vite dev server allowed."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    assert get_settings().cors_origins == DEFAULT_CORS_ORIGINS


def test_cors_origins_splits_a_comma_separated_list_and_trims_whitespace(monkeypatch):
    """Happy path: several origins are parsed in order, surrounding spaces gone."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173, https://notes.example")

    assert get_settings().cors_origins == (
        "http://localhost:5173",
        "https://notes.example",
    )


def test_cors_origins_drops_blank_entries_from_the_list(monkeypatch):
    """Edge case: a trailing comma or a stray space is not an allowed origin."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173, ,")

    assert get_settings().cors_origins == ("http://localhost:5173",)


def test_cors_origins_falls_back_to_the_default_when_every_entry_is_blank(monkeypatch):
    """Error case: an all-blank value must not produce an empty allow-list.

    An empty tuple would reject the frontend's own origin, breaking the app
    more quietly than a misconfiguration should.
    """
    monkeypatch.setenv("CORS_ORIGINS", " , ")

    assert get_settings().cors_origins == DEFAULT_CORS_ORIGINS
