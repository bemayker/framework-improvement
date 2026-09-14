"""Unit tests for the FEAT-1 server time handler and its response schema.

The handler is called directly as a function (no HTTP): the full request
cycle is the integration tier's job. Freshness is proved deterministically
here by substituting the router module's `datetime` for an advancing fake,
rather than by sleeping.
"""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time as server_time_module
from app.routers.server_time import get_server_time
from app.schemas.server_time import SERVER_TIMEZONE, ServerTimeResponse

KNOWN_UTC_MOMENT = datetime(2026, 9, 14, 10, 15, 30, 123456, tzinfo=timezone.utc)


class AdvancingClock:
    """Stand-in for `datetime` whose `now()` advances one second per call.

    Only `now` is needed: the handler calls nothing else on the name it
    imported, and a fake that answers more than the code under test uses
    would assert nothing extra.
    """

    def __init__(self, start: datetime):
        self._next = start

    def now(self, tz=None) -> datetime:
        current = self._next
        self._next = current + timedelta(seconds=1)
        return current


def test_get_server_time_returns_an_aware_utc_timestamp():
    """Happy path: the handler answers with an aware UTC time labelled UTC."""
    response = get_server_time()

    assert isinstance(response, ServerTimeResponse)
    assert response.now.tzinfo is not None
    assert response.now.utcoffset() == timedelta(0)
    assert response.timezone == SERVER_TIMEZONE == "UTC"


def test_get_server_time_reads_the_clock_on_every_call(monkeypatch):
    """Edge case: two calls return distinct, increasing times (nothing cached)."""
    monkeypatch.setattr(
        server_time_module, "datetime", AdvancingClock(KNOWN_UTC_MOMENT)
    )

    first = get_server_time()
    second = get_server_time()

    assert first.now != second.now
    assert second.now > first.now


def test_server_time_response_rejects_a_naive_datetime():
    """Error case: a datetime with no zone never reaches the wire."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1), timezone="UTC")


def test_server_time_response_rejects_a_timezone_other_than_utc():
    """Error case: the endpoint reports UTC only, enforced by the field type."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=KNOWN_UTC_MOMENT, timezone="CET")


def test_server_time_response_serialises_now_with_an_explicit_utc_offset():
    """Criterion 2: the serialised value carries `+00:00`, never the `Z` alias."""
    serialised = ServerTimeResponse(
        now=KNOWN_UTC_MOMENT, timezone=SERVER_TIMEZONE
    ).model_dump(mode="json")["now"]

    assert serialised == KNOWN_UTC_MOMENT.isoformat()
    assert serialised.endswith("+00:00")
    assert not serialised.endswith("Z")
