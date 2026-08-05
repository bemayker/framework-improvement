"""FastAPI application factory.

TEST-01 (the scaffold feature) established this factory; TEST-05 registered
the version router in it. Later features (TEST-02 health check, TEST-03 notes
CRUD) register their routers here the same way, without restructuring it.
"""

from fastapi import FastAPI

from app.core.config import get_settings
from app.routers.version import router as version_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title)
    app.include_router(version_router)
    return app


app = create_app()
