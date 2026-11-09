"""Business logic for the server clock (BUG-01, recreating FEAT-1's contract)."""

from datetime import UTC, datetime


def get_current_utc_time() -> datetime:
    """Return the current time as an aware UTC datetime.

    Evaluated on every call and never memoised: a stored value would bring the
    stale-time defect back inside the application.
    """
    return datetime.now(UTC)
