"""FastAPI application factory.

TEST-01 (the scaffold feature) instantiates the app with no feature routes.
Later features (TEST-02 health check, TEST-03 notes CRUD) register their
routers here without restructuring this factory.
"""

from fastapi import FastAPI

from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_title)
    return app


app = create_app()
