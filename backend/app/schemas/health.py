"""Response schemas for the health endpoint (TEST-02)."""

from typing import Literal

from pydantic import BaseModel


class DatabaseTarget(BaseModel):
    """The database the backend reports on.

    Both fields are optional because a degraded backend with no configured
    DATABASE_URL has no target to name at all.
    """

    host: str | None
    port: int | None


class HealthResponse(BaseModel):
    """Response body for GET /api/health, on both the 200 and 503 paths."""

    status: Literal["ok", "degraded"]
    database: DatabaseTarget
