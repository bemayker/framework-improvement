"""Business logic for the server time endpoint (FEAT-1, BUG-01).

The timestamp is computed on every call and never memoised: a value held
between requests would be stale by construction, which is the symptom BUG-01
fixes at the HTTP layer.
"""

from datetime import datetime, timezone

SERVER_TIMEZONE = "UTC"


def get_server_time() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
