# Refactor gate report: FEAT-1

Run: build-feature-20260921T070110Z
Scope: files changed by FEAT-1 plus the two sibling files named in Phase E's RECOMMENDED finding #1 (`backend/tests/unit/test_echo_unit.py`, merged under TEST-06).

## Findings applied

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | `backend/tests/unit/test_time_unit.py`, `backend/tests/unit/test_echo_unit.py`, `backend/tests/conftest.py` | `_find_route` was byte-for-byte duplicated in `test_time_unit.py` (lines 65-75) and `test_echo_unit.py` (lines 37-54) | DRY violations | RECOMMENDED | Moved `_find_route` into `backend/tests/conftest.py` as a shared module-level helper; both test modules now `from tests.conftest import _find_route` and no longer define their own copy |

## Findings not applied, with reason

None. Phase E's single RECOMMENDED finding was applied in full, including the `test_echo_unit.py` half of the proposed fix (the scope caution in the dispatch note): the extraction is a pure test-only, no-behaviour-change change confined to the same test directory this branch already touches, so it stays inside `refactoring_standards.md` Section 5's constraints (no new feature, no API/schema change, no cross-module boundary change) despite touching a file that shipped with the merged TEST-06.

`_collect_route_paths` in `backend/tests/unit/test_main_unit.py` (lines 10-28) was left as its own near-copy, per the finding's own text ("Leave `_collect_route_paths` where it is ... either is acceptable, and collapsing all three is not required"). It flattens all route paths into a set rather than locating one route object, so unifying it with `_find_route` would change its return shape; not collapsing it is the accepted option, not a declined finding.

## Files created

None. The shared helper was placed in an existing file (`backend/tests/conftest.py`), which already existed as the project's designated shared fixtures file per `CLAUDE.md`.

## Verification

- `uv run --directory backend pytest -q tests/unit` — 46 passed
- `env -u DATABASE_URL uv run --directory backend pytest -q tests/integration` — 15 passed, 14 skipped (expected: no `DATABASE_URL`/`CI` locally, per `conftest.py`'s design)

No behaviour changed; both tiers were re-run after the extraction and stayed green.
