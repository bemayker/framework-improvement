"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiates the app; later features register
their routers here without restructuring this factory. TEST-05 registers the
version router, TEST-03 the notes router, the AppException handler, CORS, and
the startup schema initialisation.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.db import init_db
from app.core.exceptions import AppException
from app.routers.notes import router as notes_router
from app.routers.version import router as version_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create any missing tables when a database is configured.

    A missing DATABASE_URL is a warning, not a failure: the backend unit tests
    instantiate the app without one, and endpoints that need no database (for
    example /api/version) must keep answering.
    """
    if get_settings().database_url:
        init_db()
    else:
        logger.warning(
            "DATABASE_URL is not set; skipping schema initialisation. "
            "Endpoints backed by the database will fail until it is configured."
        )
    yield


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Turn any AppException into the API's consistent JSON error shape."""
    logger.warning(
        "%s on %s %s: %s",
        type(exc).__name__,
        request.method,
        request.url.path,
        exc.message,
    )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title, lifespan=lifespan)
    # The browser serves the frontend from another origin than the API, so the
    # allow-list is functionally required, not optional hardening.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.add_exception_handler(AppException, app_exception_handler)
    app.include_router(version_router)
    app.include_router(notes_router)
    return app


app = create_app()
