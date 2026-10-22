"""Response schema for the stamp endpoint (FEAT-6)."""

from typing import Literal

from pydantic import BaseModel


class StampResponse(BaseModel):
    """Response body for GET /api/stamp."""

    stamp: Literal["ok"]
    db: bool
