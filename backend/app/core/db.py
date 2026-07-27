"""Database engine, session factory, and the FastAPI session dependency.

TEST-03 is the first feature to open a database connection. No migration
tool is introduced (Assumption A1 in the plan): `init_db()` creates the
schema via `Base.metadata.create_all()`, called from the app's lifespan on
startup and from the integration-test fixtures.

The engine is built lazily (on first use, not on import) so that importing
`app.main` — which pure unit tests do without ever running the app's
lifespan — never requires `DATABASE_URL` to be set.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def normalize_database_url(database_url: str) -> str:
    """Rewrites a plain ``postgresql://`` URL to use the psycopg3 driver.

    Keeps `.env.example` and `docker-compose.yml` free of a driver-specific
    scheme (Assumption A2 in the plan) while still using psycopg3 in code.
    Exported (not private) so the integration-test fixtures can reuse it
    against their own dedicated engine instead of duplicating the logic.
    """
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


def get_engine() -> Engine:
    """Returns the process-wide engine, building it on first use."""
    global _engine
    if _engine is None:
        settings = get_settings()
        if not settings.database_url:
            raise RuntimeError(
                "DATABASE_URL is not set; the notes feature requires a database connection."
            )
        _engine = create_engine(normalize_database_url(settings.database_url), future=True)
    return _engine


def _get_session_factory() -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(), autoflush=False, autocommit=False, future=True
        )
    return _session_factory


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session, always closed after use."""
    db = _get_session_factory()()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Creates all known tables. Safe to call repeatedly (no-op if present)."""
    from app.models.base import Base
    from app.models import note  # noqa: F401  (registers the Note model on Base)

    Base.metadata.create_all(bind=get_engine())
