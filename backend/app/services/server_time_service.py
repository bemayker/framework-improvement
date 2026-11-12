"""Business logic for the server time endpoint (BUG-01, restoring FEAT-1).

The time is computed on every call, never at import or module level: a value
held across requests would reproduce the staleness this item fixes.
"""

from collections.abc import Callable
from datetime import datetime, timezone

UTC_TIMEZONE_NAME = "UTC"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def current_utc_time_iso(clock: Callable[[], datetime] | None = None) -> str:
    """Return the current UTC time as ISO 8601 with an explicit +00:00 offset.

    `clock` lets tests inject fixed datetimes instead of sleeping. When it is
    omitted, `_utc_now` is looked up at call time so it can be patched.
    Raises ValueError for a naive datetime: the offset must never be guessed.
    """
    moment = (clock or _utc_now)()
    if moment.tzinfo is None or moment.utcoffset() is None:
        raise ValueError("clock returned a naive datetime; an aware one is required")
    return moment.astimezone(timezone.utc).isoformat()
