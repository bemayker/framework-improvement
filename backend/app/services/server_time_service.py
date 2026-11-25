"""Business logic for the server's current time (FEAT-1, BUG-01).

The time is computed on every call and never cached here: a stale value on the
deployed environment must come from nowhere inside the application.
"""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def get_server_time() -> str:
    """Return the current UTC time as an ISO 8601 string with a `+00:00` offset.

    Timezone-aware on purpose: a naive timestamp would leave the client
    guessing which zone it is in.
    """
    return datetime.now(timezone.utc).isoformat()
