"""Unit tests for the server time service and schema (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import get_server_time


def test_get_server_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    now = get_server_time()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_value_per_call():
    """Edge case: the service holds no cached value between calls."""
    first_instant = datetime(2026, 11, 18, 1, 30, 0, tzinfo=timezone.utc)
    second_instant = first_instant + timedelta(seconds=1)

    with patch.object(server_time_service, "datetime") as mock_datetime:
        mock_datetime.now.side_effect = [first_instant, second_instant]
        first = get_server_time()
        second = get_server_time()

    assert first != second


def test_server_time_response_serialises_explicit_utc_offset():
    """Happy path: the wire form ends in +00:00, not Z, and names UTC."""
    body = ServerTimeResponse(
        now=datetime(2026, 11, 18, 1, 30, 0, 123456, tzinfo=timezone.utc)
    ).model_dump(mode="json")

    assert body["now"] == "2026-11-18T01:30:00.123456+00:00"
    assert body["timezone"] == "UTC"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is refused."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 18, 1, 30, 0))
