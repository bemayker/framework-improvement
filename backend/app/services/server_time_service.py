"""Server time lookup (FEAT-1, BUG-01)."""

from datetime import datetime, timezone


def _utc_now() -> datetime:
    """Read the clock; a single seam so tests substitute it instead of sleeping."""
    return datetime.now(timezone.utc)


def get_server_time() -> datetime:
    """Return the current time as an aware UTC datetime, read on every call.

    Never cached at module level: a stale value is the defect BUG-01 fixes.
    """
    return _utc_now()
