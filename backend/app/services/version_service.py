"""Business logic for resolving the running application's version (TEST-05).

The version is read from installed package metadata rather than hardcoded,
so it always reflects `[project].version` in backend/pyproject.toml without
any code change when that value is bumped.
"""

import logging
from importlib.metadata import PackageNotFoundError, version

from app.core.config import get_settings

logger = logging.getLogger(__name__)

DISTRIBUTION_NAME = "task-notes-backend"
UNKNOWN_VERSION = "unknown"
BUILD_COMMIT_LENGTH = 12


def get_build_commit() -> str:
    """Return the build commit, cut to its first 12 characters (TEST-09).

    CI passes a full 40-character sha in BUILD_COMMIT; the tracker clarification
    asks the API to report only its first 12. Shorter values, including the
    "unknown" default, are returned unchanged. BUILD_COMMIT is the only source.
    """
    return get_settings().build_commit[:BUILD_COMMIT_LENGTH]


def get_app_version() -> str:
    """Return the installed application's version.

    Falls back to a sentinel value when the distribution is not installed
    (e.g. pytest run without `uv run`, which still imports `app` via
    backend/tests/__init__.py's sys.path manipulation but does not register
    package metadata). The endpoint must always answer 200, never 500, so
    this failure mode is absorbed here rather than propagated.
    """
    try:
        return version(DISTRIBUTION_NAME)
    except PackageNotFoundError:
        logger.warning(
            "Distribution %r not installed; returning sentinel version %r. "
            "Run via `uv run` so the editable install registers metadata.",
            DISTRIBUTION_NAME,
            UNKNOWN_VERSION,
        )
        return UNKNOWN_VERSION
