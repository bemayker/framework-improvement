"""Business logic for resolving the running application's version (TEST-05)
and build commit (TEST-09).

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
# CI passes a full 40-character sha; the API reports only its first 12 (TEST-09).
BUILD_COMMIT_LENGTH = 12


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


def get_build_commit() -> str:
    """Return the configured build commit cut to its first 12 characters.

    The tracker clarification on TEST-09 caps the reported value at 12
    characters because CI supplies a full 40-character sha. Shorter values,
    including the "unknown" default, are returned unchanged.
    """
    return get_settings().build_commit[:BUILD_COMMIT_LENGTH]
