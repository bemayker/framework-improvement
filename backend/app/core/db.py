"""SQLAlchemy engine, session factory, and the per-request session dependency.

TEST-03 is the first feature that persists data, so the persistence plumbing
lands here. Two deliberate choices, both recorded in the feature plan:

1. **No Alembic.** The schema is created by `create_all()` from the application
   lifespan. One table in a validation sandbox does not warrant a migration
   tool ("keep every feature as small as possible", `CLAUDE.md`).
2. **The transactional boundary is the request**, owned by `get_session()`:
   repositories `flush()` (which is what surfaces constraint violations) and the
   dependency commits once when the request handler returned without raising,
   rolling back otherwise. Keeping it here rather than inside `NoteService`
   leaves the service's only collaborator the repository Protocol, which is what
   makes it unit-testable without a database.
"""

import logging
from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings
from app.core.exceptions import ConfigurationError

logger = logging.getLogger(__name__)

BARE_POSTGRES_SCHEME = "postgresql://"
PSYCOPG_POSTGRES_SCHEME = "postgresql+psycopg://"


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model in the application."""


def normalize_database_url(url: str) -> str:
    """Pin the psycopg (v3) driver on a bare PostgreSQL connection string.

    SQLAlchemy resolves the bare `postgresql://` scheme to psycopg2, which this
    project does not install (`pyproject.toml` pins `psycopg[binary]`, i.e.
    psycopg 3). The deployment configuration hands us the bare form
    (`docker-compose.yml`, `.env.example`), so the dialect is pinned here
    instead of requiring every environment file to spell it out. Any URL that
    already names a driver is returned untouched.
    """
    if url.startswith(BARE_POSTGRES_SCHEME):
        return PSYCOPG_POSTGRES_SCHEME + url[len(BARE_POSTGRES_SCHEME) :]
    return url


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    """Return the process-wide engine, creating it on first use."""
    database_url = get_settings().database_url
    if not database_url:
        raise ConfigurationError(
            "DATABASE_URL is not set, so no database connection can be opened."
        )
    return create_engine(normalize_database_url(database_url), pool_pre_ping=True)


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker[Session]:
    """Return the process-wide session factory bound to the engine."""
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def get_session() -> Iterator[Session]:
    """Yield a session for one request, committing it if the request succeeded.

    See the module docstring: this is the application's transactional boundary.
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


def create_all() -> None:
    """Create every mapped table that does not exist yet."""
    # Imported here, not at module scope: the models import `Base` from this
    # module, so a top-level import would be circular. The import is what
    # registers the mappings on `Base.metadata` before create_all reads it.
    from app.models import note as _note_model  # noqa: F401

    Base.metadata.create_all(bind=get_engine())
    logger.info("Database schema verified: %s", ", ".join(sorted(Base.metadata.tables)))
