"""Response schema for the uptime endpoint (TEST-07)."""

from datetime import datetime, timezone

from pydantic import AwareDatetime, BaseModel, Field, field_serializer


class UptimeResponse(BaseModel):
    """Response body for GET /api/uptime.

    `uptime_seconds` is bounded at zero by the field itself rather than by a
    clamp in the router: the handler measures elapsed time on the monotonic
    clock, so a negative value would mean the measurement is wrong and the
    response should be rejected instead of rounded up.

    `started_at` is typed `AwareDatetime`, so a naive value is rejected at
    construction rather than serialised without a zone.
    """

    uptime_seconds: float = Field(ge=0)
    started_at: AwareDatetime

    @field_serializer("started_at")
    def serialize_started_at(self, value: datetime) -> str:
        """Serialise `started_at` in UTC with the explicit `+00:00` offset.

        The criterion asks for an explicit offset and the plan pins that to the
        numeric `+00:00` form, while pydantic's default datetime serialiser
        emits `Z`. `astimezone(timezone.utc)` makes the UTC half hold for any
        aware input rather than relying on the caller, and matches the pin
        FEAT-1's `now` field already uses so the project's two timestamp
        endpoints agree on the wire format.
        """
        return value.astimezone(timezone.utc).isoformat()
