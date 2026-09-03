"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import datetime, timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime."""

    # The non-negative bound belongs in the contract rather than in a handler
    # check, so it reaches the OpenAPI document as `minimum: 0` (the precedent
    # `schemas/echo.py` set for its length bound).
    uptime_seconds: float = Field(ge=0)
    # AwareDatetime rather than plain datetime: a naive value is rejected at
    # model construction by the library, so the UTC guarantee below is never
    # handed a value whose offset it would have to invent.
    started_at: AwareDatetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime):
        """Serialise as ISO 8601 in UTC with the explicit `+00:00` offset.

        Pydantic's default emits `Z`, which is the ISO 8601 UTC *designator*
        rather than an offset; criterion 3 asks for an explicit offset.
        Normalising with `astimezone` first makes the UTC guarantee hold for
        any aware input, not only one that already is UTC.

        **The missing return annotation is deliberate: do not add one.**
        FastAPI documents a response in Pydantic's serialization mode, where a
        field serializer's return annotation *replaces* the field's JSON
        schema. Annotating this `-> str` yields `{"type": "string"}` and drops
        `format: "date-time"` from `/openapi.json` while the serialised value
        is unchanged, so nothing but the OpenAPI document would show it
        (measured on pydantic 2.13.4; `return_type=None` is worse still and
        emits `type: "null"`). Two tests fail loudly if anyone adds one:
        `test_started_at_serialization_schema_keeps_the_date_time_format` and
        `test_openapi_declares_the_uptime_bound_and_response_schema`.
        """
        return value.astimezone(timezone.utc).isoformat()
