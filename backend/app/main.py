"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiated the app with no feature routes.
TEST-05 registered the version router. TEST-03 registers the notes router,
allows the frontend origin through CORS, and creates the notes schema at
startup. Later features register their routers here without restructuring
this factory.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import connect, ensure_schema
from app.routers.notes import router as notes_router
from app.routers.version import router as version_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Create the notes schema at startup when a database is configured.

    Without DATABASE_URL the app still starts, so unit tests and a bare
    TestClient need no database; the DB-backed routes then fail loudly with a
    logged 500 instead. A schema-creation failure is logged rather than
    fatal for the same reason: a database that is merely slow to accept
    connections must not prevent the process from coming up.
    """
    settings = get_settings()
    if settings.database_url:
        try:
            with connect() as connection:
                ensure_schema(connection)
        except Exception:
            logger.exception("Notes schema creation failed at startup; DB-backed routes will fail.")
    else:
        logger.warning("DATABASE_URL is not set; skipping notes schema creation.")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.include_router(version_router)
    app.include_router(notes_router)
    return app


app = create_app()
