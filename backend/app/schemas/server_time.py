"""Response schema for the server time endpoint (FEAT-1)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.uptime import UtcTimestamp


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time."""

    # The response always carries both fields, so the published schema must
    # list the defaulted `timezone` as required too (API contract).
    model_config = ConfigDict(json_schema_serialization_defaults_required=True)

    # The offset is pinned to "+00:00", never "Z": UtcTimestamp serialises that
    # way, matching `started_at` on GET /api/uptime so the API spells UTC once.
    now: UtcTimestamp
    timezone: Literal["UTC"] = "UTC"
