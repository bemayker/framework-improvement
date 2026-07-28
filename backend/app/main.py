"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiated the app with no feature routes. / TEST-03 registers the notes router and TEST-05 the version router; later / features register their own routers here too, without restructuring this / factory.

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routers.version import router as version_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title)
    app.include_router(version_router)
    return app


app = create_app()
