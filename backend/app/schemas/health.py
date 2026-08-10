"""Response schema for the health endpoint (TEST-02)."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response body for GET /api/health, on both the 200 and 503 paths."""

    status: Literal["ok", "degraded"]
