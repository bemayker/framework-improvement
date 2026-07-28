"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiates the app with no feature routes.
Later features register their routers here without restructuring this factory:
TEST-05 the version router, TEST-03 the notes router plus the pieces the notes
slice needs — CORS for the browser client, the AppException handler, and the
startup schema creation.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.db import create_schema
from app.core.exceptions import AppException
from app.routers.notes import router as notes_router
from app.routers.version import router as version_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Ensure the database schema exists when a database is configured.

    Schema creation is idempotent, so a restart against an existing database is
    a no-op. Without DATABASE_URL the app still starts — the version endpoint
    and the unit tier need no database — and the gap is logged rather than
    raised, so the notes endpoints are the only thing that then fails.
    """
    if get_settings().database_url:
        create_schema()
    else:
        logger.warning(
            "DATABASE_URL is not set; skipping schema creation. The notes "
            "endpoints will fail until it is configured (see .env.example)."
        )
    yield


async def handle_app_exception(request: Request, exc: AppException) -> JSONResponse:
    """Render any domain error as the API's consistent JSON error body."""
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
    # The frontend is served from another origin (5173 vs 8000), so without CORS
    # the browser blocks every notes request.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.add_exception_handler(AppException, handle_app_exception)
    app.include_router(version_router)
    app.include_router(notes_router)
    return app


app = create_app()
