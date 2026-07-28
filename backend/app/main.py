"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiated the app with no feature routes.
TEST-03 registers the notes router; later features register their own
routers here too, without restructuring this factory.
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
from app.routers import notes


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Only ensure the schema when a database is actually configured, so
    # backend unit tests (which never start the app through this lifespan)
    # and any other DATABASE_URL-less run keep working (plan assumption 7).
    settings = get_settings()
    if settings.database_url:
        init_db()
    else:
        logging.getLogger(__name__).warning(
            "DATABASE_URL is not set; skipping database schema initialization."
        )
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title, lifespan=_lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppException)
    async def _handle_app_exception(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    app.include_router(notes.router)

    return app


app = create_app()
