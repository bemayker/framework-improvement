"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiated the app with no feature routes.
TEST-03 registers the notes router, wires up the database lifecycle, CORS
for the frontend origin, and the `AppException` -> JSON error handler.
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

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        logger.warning(
            "Request rejected with %s: %s", exc.__class__.__name__, str(exc),
            extra={"path": request.url.path},
        )
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    app.include_router(notes.router)

    return app


app = create_app()
