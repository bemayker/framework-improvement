"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services.server_time_service import get_server_time

# Two reads can land in the same clock tick; retry a bounded number of times
# so the freshness assertion cannot flake on a fast machine.
MAX_ATTEMPTS = 1000


def test_get_server_time_returns_aware_utc_datetime():
    """Happy path: the value carries a zero UTC offset."""
    value = get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_value_per_call():
    """Edge case: successive calls advance, so nothing is cached."""
    first = get_server_time()

    later = first
    for _ in range(MAX_ATTEMPTS):
        later = get_server_time()
        if later > first:
            break

    assert later > first


def test_get_server_time_value_lies_between_surrounding_clock_reads():
    """Error guard: a fixed or wrong-zone value falls outside the bracket."""
    before = datetime.now(timezone.utc)
    value = get_server_time()
    after = datetime.now(timezone.utc)

    assert before <= value <= after
