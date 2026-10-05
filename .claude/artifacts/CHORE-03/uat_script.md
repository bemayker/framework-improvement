# UAT Script: CHORE-03 TEST-10 follow-up: known-improvements

## Prerequisites

- A checkout of branch `feature/CHORE-03-test-10-follow-up`.
- For criterion 2 steps 2-3: Docker running; from the repository root, the stack built with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (frontend `http://localhost:5183`, backend `http://localhost:8010`).
- A browser with dev tools.

## Criterion 1: the decision log records that the commit token inherits the footer's style under Design Reference NONE

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 1 | Open `.claude/artifacts/CHORE-03/decisions.md` | An entry tagged `[CHORE-03]` names the `app-footer-commit` token, states it inherits the footer's style (`fontSize 0.875rem`, `color #5f5f5f`) with no token-specific spacing, monospace or emphasis, and states that token-specific values come only from a configured design reference | [ ] Pass [ ] Fail |
| 2 | Open `CLAUDE.md` and read `## Design Reference` | `Mode: NONE`, matching the condition the entry names | [ ] Pass [ ] Fail |

## Criterion 2: no application change; the footer renders exactly as merged

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 3 | From the repository root run `git diff --name-only origin/main...HEAD` | Only paths under `.claude/artifacts/CHORE-03/` and `e2e/uat/` are listed; nothing under `frontend/`, `backend/`, `e2e/tests/` or the repository root | [ ] Pass [ ] Fail |
| 4 | Open `http://localhost:5183/` and scroll to the footer | It reads exactly `Task Notes v0.1.0 · 0123456` | [ ] Pass [ ] Fail |
| 5 | In DevTools Elements select the `span` with `data-testid="app-footer-commit"` and open Computed | `font-size` is `14px`, `color` is `rgb(95, 95, 95)`, and `font-family` and `font-weight` equal those of the parent `footer` (`data-testid="app-footer"`); the span has no inline `style` attribute (edge case) | [ ] Pass [ ] Fail |
| 6 | Run `npm --prefix frontend test -- AppFooter` from the repository root | Every AppFooter case passes, including the success case showing `Task Notes v9.8.7 · abc123d` | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Pass | Fail |
|-----------|-------|------|------|
| 1. Decision log records the inherited style | 1-2 | | |
| 2. Footer renders exactly as merged, no application change | 3-6 | | |

Tester: ______________  Date: ______________  Overall: [ ] Pass [ ] Fail
