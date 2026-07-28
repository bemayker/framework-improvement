"""Database connectivity: engine, session factory, declarative base, schema init.

The engine is created lazily so importing the application never requires a
reachable database: unit tests import `app` with no DATABASE_URL set and must
keep running (`testing_standards.md` Section 1.1).
"""

import logging
from collections.abc import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model in the application."""


def get_engine() -> Engine:
    """Return the process-wide engine, creating it on first use."""
    global _engine
    if _engine is None:
        url = get_settings().sqlalchemy_url
        if url is None:
            raise RuntimeError(
                "DATABASE_URL is not set, so no database engine can be created. "
                "See .env.example for the expected value."
            )
        # pool_pre_ping keeps the app usable after the database restarts, which
        # happens routinely with `docker compose restart db` in development.
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    """Return the process-wide session factory, creating it on first use."""
    global _session_factory
    if _session_factory is None:
        # expire_on_commit=False: routers serialise the ORM object returned by
        # the service after it commits, and expiring would force a re-SELECT.
        _session_factory = sessionmaker(
            bind=get_engine(), autoflush=False, expire_on_commit=False
        )
    return _session_factory


def get_session() -> Iterator[Session]:
    """FastAPI dependency yielding a session that is always closed.

    Closing a session with an open transaction rolls it back, so a request that
    fails before the service commits leaves nothing behind.
    """
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def init_db(engine: Engine | None = None) -> None:
    """Create any missing tables. Idempotent, and the project's migration runner.

    Called on application startup (when DATABASE_URL is set) and by the
    integration-test fixtures. Importing the models module here rather than at
    module scope registers the mappers on Base.metadata without a circular
    import, since the models import Base from this module.
    """
    from app.models.note import Note  # noqa: F401

    target = engine if engine is not None else get_engine()
    Base.metadata.create_all(bind=target)
    logger.info("Database schema verified; tables: %s", ", ".join(Base.metadata.tables))
