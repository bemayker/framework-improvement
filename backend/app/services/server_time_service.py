"""Server time service (BUG-01, recreating FEAT-1)."""

from datetime import datetime, timezone


def get_server_now() -> datetime:
    """Return the current UTC time as a timezone-aware datetime.

    Evaluated on every call: a cached or module-level timestamp would serve
    a stale value.
    """
    return datetime.now(timezone.utc)
