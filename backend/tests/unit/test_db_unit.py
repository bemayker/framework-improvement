"""Unit tests for the database helpers (backend/app/core/db.py).

``to_sqlalchemy_url`` is the single point of failure for driver selection: the
committed configuration carries plain libpq URLs while this project installs
psycopg 3 only, so a URL that reaches SQLAlchemy unrewritten fails on the
psycopg2 dialect. It is a pure string transformation, so it is unit-tested here
rather than only incidentally through the integration fixtures.

The URLs below carry no credentials on purpose: the function inspects the scheme
prefix and nothing else.
"""

from app.core.db import to_sqlalchemy_url


def test_to_sqlalchemy_url_returns_a_driver_url_untouched():
    """Happy path: a URL that already names its driver is passed through as-is."""
    url = "postgresql+psycopg://db.example:5432/tasknotes"

    assert to_sqlalchemy_url(url) == url


def test_to_sqlalchemy_url_rewrites_a_libpq_postgresql_url_to_psycopg():
    """Happy path: the scheme docker-compose.yml and .env.example use is rewritten."""
    assert (
        to_sqlalchemy_url("postgresql://db.example:5432/tasknotes")
        == "postgresql+psycopg://db.example:5432/tasknotes"
    )


def test_to_sqlalchemy_url_rewrites_the_postgres_scheme_alias():
    """Edge case: the shorter ``postgres://`` alias many hosts emit is rewritten too."""
    assert (
        to_sqlalchemy_url("postgres://db.example:5432/tasknotes")
        == "postgresql+psycopg://db.example:5432/tasknotes"
    )


def test_to_sqlalchemy_url_passes_an_unknown_scheme_through_unchanged():
    """Error case: a non-PostgreSQL URL is not rewritten into an invalid one.

    Guessing a psycopg driver for another backend would turn a URL SQLAlchemy
    could still resolve into one it cannot, so the function leaves it alone and
    lets SQLAlchemy report the real problem.
    """
    url = "sqlite:///./tasknotes.db"

    assert to_sqlalchemy_url(url) == url
