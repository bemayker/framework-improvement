"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiates the app with no feature routes.
Later features register their routers here without restructuring this factory:
TEST-05 registers the version router, TEST-03 the notes router plus the
startup schema initialisation and the CORS middleware the browser needs,
TEST-02 the health router, TEST-06 the echo router, and TEST-07 the uptime
router.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import ensure_schema
from app.routers.echo import router as echo_router
from app.routers.health import router as health_router
from app.routers.notes import router as notes_router
from app.routers.uptime import router as uptime_router
from app.routers.version import router as version_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create the notes table on startup, when a database is configured.

    Skipped with a warning when DATABASE_URL is unset: the version endpoint
    needs no database and must still answer, so startup never hard-requires
    one (the notes endpoints then fail loudly per request instead).
    """
    settings = get_settings()
    if settings.database_url is None:
        logger.warning(
            "DATABASE_URL is not set; skipping notes schema initialisation. "
            "The notes endpoints will not work until it is configured."
        )
    else:
        ensure_schema(settings.database_url)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.include_router(version_router)
    app.include_router(notes_router)
    app.include_router(health_router)
    app.include_router(echo_router)
    app.include_router(uptime_router)
    return app


app = create_app()
