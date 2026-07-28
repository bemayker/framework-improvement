"""Database connectivity for the notes feature (TEST-03).

Holds the SQLAlchemy engine and session factory, the declarative ``Base`` every
ORM model registers on, the ``get_db`` FastAPI dependency (a request's
transactional boundary) and ``create_schema``, the idempotent schema creator the
application runs at startup and the integration fixtures use as their migration
runner.

The engine is built lazily on first use so importing the application never needs
a reachable database: the unit tier imports ``app`` with no DATABASE_URL set and
must keep running (`testing_standards.md` Section 1.1).
"""

import logging
from collections.abc import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)

PSYCOPG_SCHEME = "postgresql+psycopg://"
LIBPQ_SCHEMES = ("postgresql://", "postgres://")

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model in the application."""


def to_sqlalchemy_url(database_url: str) -> str:
    """Return ``database_url`` with the psycopg 3 driver SQLAlchemy needs.

    ``.env.example`` and docker-compose.yml carry plain libpq URLs
    (``postgresql://...``), which SQLAlchemy would resolve to the psycopg2
    dialect this project does not install. A URL that already names a driver is
    returned untouched, so an explicit ``postgresql+psycopg://`` keeps working.
    """
    if database_url.startswith("postgresql+"):
        return database_url
    for scheme in LIBPQ_SCHEMES:
        if database_url.startswith(scheme):
            return PSYCOPG_SCHEME + database_url[len(scheme) :]
    return database_url


def get_engine() -> Engine:
    """Return the process-wide engine, creating it on first use."""
    global _engine
    if _engine is None:
        database_url = get_settings().database_url
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is not set, so no database engine can be created. "
                "See .env.example for the expected value."
            )
        # pool_pre_ping keeps the app usable after the database restarts, which
        # happens routinely with `docker compose restart db` in development.
        _engine = create_engine(to_sqlalchemy_url(database_url), pool_pre_ping=True)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    """Return the process-wide session factory, creating it on first use."""
    global _session_factory
    if _session_factory is None:
        # expire_on_commit=False: the router serialises the ORM object the
        # service returned, and expiring on commit would force a re-SELECT on a
        # session that is already closing.
        _session_factory = sessionmaker(
            bind=get_engine(), autoflush=False, expire_on_commit=False
        )
    return _session_factory


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a session, the request's transaction boundary.

    The session commits when the request handler returned normally and rolls
    back when it raised, so a failed request never leaves partial writes behind.
    """
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_schema(engine: Engine | None = None) -> None:
    """Create any missing tables. Idempotent, so it is safe on every startup."""
    # Imported for its side effect: importing the model registers it on
    # Base.metadata, which is what create_all reads. A module-level import here
    # would be circular (the model imports Base from this module).
    from app.models import note  # noqa: F401

    target = engine if engine is not None else get_engine()
    Base.metadata.create_all(bind=target)
    logger.info("Database schema verified for %s", target.url.render_as_string())
