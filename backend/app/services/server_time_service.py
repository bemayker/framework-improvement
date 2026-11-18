"""Server time service (FEAT-1 endpoint, BUG-01 header).

The time is computed on every call and never held in module state, so a
response can only be stale because something in front of the API cached it,
which the router's Cache-Control header (BUG-01) now forbids.
"""

from datetime import datetime, timezone


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
