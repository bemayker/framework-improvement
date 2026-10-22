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
    """Response body for GET /api/health, on both the 200 and 503 paths.

    FEAT-5 adds `health`, "green" when status is "ok" and "red" when degraded.
    """

    status: Literal["ok", "degraded"]
    health: Literal["green", "red"]
    database: DatabaseTarget
