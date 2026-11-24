"""Server time service (BUG-01, recreating FEAT-1's contract).

The time is computed on every call and never cached at module level: a cached
value would reproduce the staleness this item fixes.
"""

from collections.abc import Callable
from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return the current time as an aware UTC datetime."""
    return datetime.now(UTC)


def get_server_time(clock: Callable[[], datetime] | None = None) -> datetime:
    """Return the current server time as an aware UTC datetime.

    `clock` is injectable for tests; without it the module's `utc_now` is
    looked up at call time so a test can also replace that. A naive value from
    the clock raises ValueError, so a naive time can never be serialised.
    """
    value = clock() if clock is not None else utc_now()
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("clock returned a naive datetime; an aware one is required")
    return value.astimezone(UTC)
