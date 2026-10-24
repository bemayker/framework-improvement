"""Business logic for resolving the running application's version (TEST-05).

The version is read from installed package metadata rather than hardcoded,
so it always reflects `[project].version` in backend/pyproject.toml without
any code change when that value is bumped.
"""

import logging
from importlib.metadata import PackageNotFoundError, version

logger = logging.getLogger(__name__)

DISTRIBUTION_NAME = "task-notes-backend"
UNKNOWN_VERSION = "unknown"


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
