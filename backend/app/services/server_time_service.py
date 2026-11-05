"""Server time service (BUG-01)."""

from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """Return the current instant as a timezone-aware UTC datetime.

    Computed on every call: a cached value would be the same staleness the
    edge cache caused.
    """
    return datetime.now(timezone.utc)
