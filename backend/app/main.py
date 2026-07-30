"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiates the app with no feature routes.
Later features register their routers here without restructuring this factory:
TEST-05 registers the version router, TEST-03 the notes router plus the
persistence lifespan and the CORS middleware the browser client needs.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import create_all
from app.core.exceptions import AppException, app_exception_handler
from app.routers.notes import router as notes_router
from app.routers.version import router as version_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create the database schema at startup when a database is configured.

    TEST-03 uses `metadata.create_all` instead of a migration tool (one table in
    a validation sandbox). It runs only when DATABASE_URL is set, so a DB-free
    process — the unit-test run, or a container started without a database —
    still boots and still serves the endpoints that need no database.
    """
    if get_settings().database_url:
        create_all()
    else:
        logger.warning(
            "DATABASE_URL is not set: skipping schema creation. The notes "
            "endpoints will fail until a database is configured."
        )
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.add_exception_handler(AppException, app_exception_handler)
    app.include_router(version_router)
    app.include_router(notes_router)
    return app


app = create_app()
