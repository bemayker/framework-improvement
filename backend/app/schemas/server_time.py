"""Response schema for the server time endpoint (FEAT-1)."""

from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, field_serializer

# The label is declared here rather than in the router so it has one source:
# the router imports it for the response value and the tests import it for
# their assertions, instead of restating the literal.
SERVER_TIMEZONE: str = "UTC"


class ServerTimeResponse(BaseModel):
    """Response body for GET /api/time.

    `now` is typed `AwareDatetime`, so a naive value is rejected at
    construction rather than serialised without a zone: that is the "never
    naive" guarantee the acceptance criteria ask for.
    """

    now: AwareDatetime
    timezone: Literal["UTC"]

    @field_serializer("now")
    def serialize_now(self, value: datetime) -> str:
        """Serialise `now` with the explicit `+00:00` offset, never `Z`.

        The criterion asks for an explicit offset and the plan pins that to the
        numeric `+00:00` form. Pydantic's default datetime serialiser emits
        `Z`, so the wire format is owned by the schema that owns the field
        rather than left to that default or formatted in the router.
        """
        return value.isoformat()
