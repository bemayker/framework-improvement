"""Business logic for the health endpoint's connectivity probe (TEST-02).

The probe deliberately does not reuse `app.core.db.get_connection`: that
dependency raises when DATABASE_URL is unset and opens its connection with no
timeout bound, both wrong here. A health endpoint must always answer, and it
must answer quickly even when the database host is unreachable rather than
black-holing the request until the driver gives up.
"""

import logging

import psycopg

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Bounds the probe: a host that silently drops packets would otherwise hold the
# request open for the driver's default wait, turning a health check into a hang.
CONNECT_TIMEOUT_SECONDS = 2

# Cheapest statement that proves the connection can actually execute, not just
# that the TCP handshake and authentication succeeded.
PROBE_SQL = "SELECT 1"


def check_database_connectivity() -> bool:
    """Return whether PostgreSQL is reachable and able to answer a query.

    Never raises: every failure mode (unset configuration, refused connection,
    timeout, authentication failure, DNS failure) is logged with context and
    reported as `False`, so the endpoint reports degraded rather than 500.
    """
    settings = get_settings()
    if settings.database_url is None:
        logger.warning(
            "DATABASE_URL is not configured; reporting the service as degraded "
            "because database connectivity cannot be verified."
        )
        return False

    try:
        with psycopg.connect(
            settings.database_url, connect_timeout=CONNECT_TIMEOUT_SECONDS
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute(PROBE_SQL)
    except (psycopg.Error, OSError) as exc:
        logger.warning(
            "Database connectivity probe failed after at most %ss: %s: %s",
            CONNECT_TIMEOUT_SECONDS,
            type(exc).__name__,
            exc,
        )
        return False

    return True
