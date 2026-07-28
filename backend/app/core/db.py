"""Database connectivity: engine, session factory, and the ORM declarative base.

Introduced by TEST-03. TEST-01's code comments deferred DB connectivity to
TEST-02, but TEST-03 depends only on TEST-01 and cannot satisfy its
persistence acceptance criterion without one, so it lands here instead
(plan assumption 1). Written so TEST-02 consumes this module rather than
replacing it.

No Alembic: `init_db()` is the migration runner for this single-table
project (plan assumption 2), called on app startup and by the integration
test fixtures.
"""

import logging
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    """Return the module-level SQLAlchemy engine, creating it on first use.

    Raises `RuntimeError` if `DATABASE_URL` is not set: callers that only run
    without a database (unit tests) must never reach this function.
    """
    global _engine
    if _engine is None:
        settings = get_settings()
        if settings.sqlalchemy_url is None:
            raise RuntimeError("DATABASE_URL is not set; cannot create a database engine.")
        _engine = create_engine(settings.sqlalchemy_url, pool_pre_ping=True)
    return _engine


def _get_session_factory() -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)
    return _session_factory


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a session, always closes it."""
    session = _get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    """Idempotently create all tables declared on `Base`.

    Safe to call repeatedly: `create_all` only creates tables that do not
    already exist.
    """
    Base.metadata.create_all(get_engine())
    logger.info("Database schema ensured (init_db).")
