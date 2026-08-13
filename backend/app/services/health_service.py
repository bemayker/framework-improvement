"""Business logic for the health endpoint (TEST-02).

The report is never answered from configuration alone: every call runs a real
connectivity probe, so a backend whose database has gone away reports degraded
without a restart.
"""

import logging
from dataclasses import dataclass

import psycopg
from psycopg.conninfo import conninfo_to_dict

from app.core.config import get_settings
from app.core.db import probe_connection

logger = logging.getLogger(__name__)

STATUS_OK = "ok"
STATUS_DEGRADED = "degraded"

# libpq's own default, applied when the connection string names no port, so
# the attempted target the degraded payload reports is the one libpq tried.
DEFAULT_POSTGRES_PORT = 5432


@dataclass(frozen=True)
class HealthReport:
    """The outcome of one health check: the verdict and the database target."""

    status: str
    host: str | None
    port: int | None


def get_health() -> HealthReport:
    """Probe the database and report the resolved or attempted target.

    Healthy means the probe connected and answered, and the target is then the
    live connection's own host and port. Any failure, including an unset
    DATABASE_URL, is degraded.
    """
    database_url = get_settings().database_url
    if database_url is None:
        logger.error(
            "DATABASE_URL is not configured; reporting degraded health with no target."
        )
        return HealthReport(status=STATUS_DEGRADED, host=None, port=None)

    try:
        host, port = probe_connection(database_url)
    except psycopg.Error as error:
        attempted_host, attempted_port = _attempted_target(database_url)
        logger.error(
            "Database health probe failed for %s:%s: %s",
            attempted_host,
            attempted_port,
            error,
        )
        return HealthReport(
            status=STATUS_DEGRADED, host=attempted_host, port=attempted_port
        )

    return HealthReport(status=STATUS_OK, host=host, port=port)


def _attempted_target(database_url: str) -> tuple[str | None, int | None]:
    """Parse the target a failed probe tried to reach out of the connection string."""
    try:
        conninfo = conninfo_to_dict(database_url)
    except psycopg.Error as error:
        logger.error(
            "DATABASE_URL is not a parseable connection string, so the attempted "
            "health target cannot be reported: %s",
            error,
        )
        return None, None

    host = conninfo.get("host")
    port = conninfo.get("port")
    return host, DEFAULT_POSTGRES_PORT if port is None else int(port)
