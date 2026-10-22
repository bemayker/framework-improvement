"""Business logic for the stamp endpoint (FEAT-6).

`db` is a reported fact, not a health verdict: an unreachable or unconfigured
database yields `db=False` rather than an error status (that is the health
endpoint's job).
"""

import logging
from dataclasses import dataclass

import psycopg

from app.core.config import get_settings
from app.core.db import probe_connection

logger = logging.getLogger(__name__)

STAMP_OK = "ok"


@dataclass(frozen=True)
class StampReport:
    """The stamp and whether the database answered SELECT 1."""

    stamp: str
    db: bool


def get_stamp() -> StampReport:
    """Probe the database and report whether it answered."""
    database_url = get_settings().database_url
    if database_url is None:
        logger.error("DATABASE_URL is not configured; reporting db false.")
        return StampReport(stamp=STAMP_OK, db=False)

    try:
        probe_connection(database_url)
    except psycopg.Error as error:
        logger.error("Database stamp probe failed: %s", error)
        return StampReport(stamp=STAMP_OK, db=False)

    return StampReport(stamp=STAMP_OK, db=True)
