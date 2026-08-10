"""Unit tests for the shared fixtures' DATABASE_URL guard (TEST-03).

Regression guard for the CI hole this closed: with DATABASE_URL unset the
integration tier skipped every test and exited 0, which reads as a pass for a
tier `CLAUDE.md` declares enabled and blocking. These tests fail if the guard
is ever softened back to an unconditional skip.
"""

import pytest

from tests.conftest import require_database_url

URL = "postgresql://tasknotes:tasknotes@localhost:5432/tasknotes"


def test_require_database_url_returns_the_configured_url():
    """Happy path: a configured value is handed straight to the fixture."""
    assert require_database_url({"DATABASE_URL": URL, "CI": "true"}) == URL


def test_require_database_url_skips_outside_ci_when_unset():
    """A developer machine with no database skips rather than fails."""
    with pytest.raises(pytest.skip.Exception, match="DATABASE_URL is not set"):
        require_database_url({})


def test_require_database_url_fails_in_ci_when_unset():
    """Error case: in CI a missing database is a pipeline defect, not a skip."""
    with pytest.raises(pytest.fail.Exception, match="must not pass it by skipping"):
        require_database_url({"CI": "true"})


def test_require_database_url_treats_an_empty_value_as_unset():
    """Edge case: an empty variable is not a usable connection string."""
    with pytest.raises(pytest.fail.Exception, match="must not pass it by skipping"):
        require_database_url({"DATABASE_URL": "", "CI": "true"})
