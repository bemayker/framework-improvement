"""Unit tests for the server time router (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.server_time import get_server_time, get_utc_now

FIRST_INSTANT = datetime(2026, 10, 18, 20, 41, 7, tzinfo=timezone.utc)


def test_get_utc_now_returns_aware_utc_datetime():
    before = datetime.now(timezone.utc)

    value = get_utc_now()

    after = datetime.now(timezone.utc)
    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)
    assert before <= value <= after


def test_get_server_time_returns_the_injected_instant():
    response = get_server_time(now=FIRST_INSTANT)

    assert response.now == FIRST_INSTANT
    assert response.timezone == "UTC"


def test_get_server_time_two_instants_one_second_apart_differ_by_one_second():
    first = get_server_time(now=FIRST_INSTANT)
    second = get_server_time(now=FIRST_INSTANT + timedelta(seconds=1))

    assert second.now != first.now
    assert second.now - first.now == timedelta(seconds=1)


def test_get_server_time_rejects_naive_instant():
    with pytest.raises(ValidationError):
        get_server_time(now=datetime(2026, 10, 18, 20, 41, 7))
