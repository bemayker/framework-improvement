"""Unit tests for the stamp service (backend/app/services/stamp_service.py).

The probe is mocked: whether PostgreSQL answers is the integration tier's
question; this tier owns the mapping from probe outcome to `db`.
"""

import psycopg

from app.services import stamp_service

DATABASE_URL = "postgresql://tasknotes:tasknotes@db:5432/tasknotes"


def test_get_stamp_returns_db_true_when_the_probe_succeeds(monkeypatch):
    """Happy path: a successful probe yields stamp ok and db true."""
    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)
    monkeypatch.setattr(
        stamp_service, "probe_connection", lambda url: ("127.0.0.1", 5432)
    )

    report = stamp_service.get_stamp()

    assert report == stamp_service.StampReport(stamp="ok", db=True)


def test_get_stamp_returns_db_false_when_the_probe_raises(monkeypatch):
    """Error case: a psycopg error is reported as db false, not raised."""
    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)

    def failing_probe(url: str) -> tuple[str, int]:
        raise psycopg.OperationalError("connection refused")

    monkeypatch.setattr(stamp_service, "probe_connection", failing_probe)

    report = stamp_service.get_stamp()

    assert report == stamp_service.StampReport(stamp="ok", db=False)


def test_get_stamp_returns_db_false_without_probing_when_database_url_unset(
    monkeypatch,
):
    """Edge case: nothing to probe, so the probe must not be called."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    def fail_if_called(url: str) -> tuple[str, int]:
        raise AssertionError(f"probe_connection must not be called, got {url!r}")

    monkeypatch.setattr(stamp_service, "probe_connection", fail_if_called)

    report = stamp_service.get_stamp()

    assert report == stamp_service.StampReport(stamp="ok", db=False)
