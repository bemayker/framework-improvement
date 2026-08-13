"""Unit tests for the health service (backend/app/services/health_service.py).

The probe is mocked here: whether PostgreSQL actually answers is the
integration tier's question, and this tier owns the mapping from probe
outcome to verdict and reported target.
"""

import psycopg

from app.services import health_service

REACHABLE_DATABASE_URL = "postgresql://tasknotes:tasknotes@db:5432/tasknotes"
UNREACHABLE_DATABASE_URL = "postgresql://tasknotes:tasknotes@127.0.0.1:9/tasknotes"
PORTLESS_DATABASE_URL = "postgresql://tasknotes:tasknotes@db/tasknotes"


def test_get_health_returns_ok_with_the_live_connection_target(monkeypatch):
    """Happy path: a successful probe yields ok and the target as connected.

    The probe returns the remapped port the connection actually used, which
    must reach the payload instead of the configured 5432.
    """
    monkeypatch.setenv("DATABASE_URL", REACHABLE_DATABASE_URL)
    monkeypatch.setattr(
        health_service, "probe_connection", lambda url: ("127.0.0.1", 55013)
    )

    report = health_service.get_health()

    assert report.status == health_service.STATUS_OK
    assert (report.host, report.port) == ("127.0.0.1", 55013)


def test_get_health_returns_degraded_without_probing_when_database_url_unset(
    monkeypatch,
):
    """Edge case: no configured database is degraded with a null target.

    The probe must not be called at all: there is nothing to probe, and a
    probe on `None` would raise instead of reporting.
    """
    monkeypatch.delenv("DATABASE_URL", raising=False)

    def fail_if_called(url: str) -> tuple[str, int]:
        raise AssertionError(f"probe_connection must not be called, got {url!r}")

    monkeypatch.setattr(health_service, "probe_connection", fail_if_called)

    report = health_service.get_health()

    assert report.status == health_service.STATUS_DEGRADED
    assert (report.host, report.port) == (None, None)


def test_get_health_returns_degraded_with_attempted_target_when_probe_raises(
    monkeypatch,
):
    """Error case: a failing probe yields degraded plus the attempted target."""
    monkeypatch.setenv("DATABASE_URL", UNREACHABLE_DATABASE_URL)

    def raise_operational_error(url: str) -> tuple[str, int]:
        raise psycopg.OperationalError("connection refused")

    monkeypatch.setattr(health_service, "probe_connection", raise_operational_error)

    report = health_service.get_health()

    assert report.status == health_service.STATUS_DEGRADED
    assert (report.host, report.port) == ("127.0.0.1", 9)


def test_get_health_reports_the_libpq_default_port_when_the_url_names_none(
    monkeypatch,
):
    """Edge case: a portless URL reports the port libpq would have used."""
    monkeypatch.setenv("DATABASE_URL", PORTLESS_DATABASE_URL)

    def raise_operational_error(url: str) -> tuple[str, int]:
        raise psycopg.OperationalError("connection refused")

    monkeypatch.setattr(health_service, "probe_connection", raise_operational_error)

    report = health_service.get_health()

    assert report.status == health_service.STATUS_DEGRADED
    assert (report.host, report.port) == ("db", health_service.DEFAULT_POSTGRES_PORT)
