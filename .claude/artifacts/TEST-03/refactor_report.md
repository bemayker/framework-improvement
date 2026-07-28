# Refactor Gate report, TEST-03 (build-feature Phase F)

Standard: `refactoring_standards.md` (v0.3.34). Scope: every file created or modified by
TEST-03, per `.claude/artifacts/TEST-03/review_scope.md`. Project Mode is `greenfield`, so
the checklist applies as written rather than diff-scoped.

Single pass, run once after the Phase E self-review, whose RECOMMENDED findings are
mandatory input here and have no other fix round (`review_standards.md` Section 6.3).

## Applied (RECOMMENDED)

| # | File | Finding | Category | Severity | Change applied |
| - | ---- | ------- | -------- | -------- | -------------- |
| 1 | `backend/tests/conftest.py:31` | `DEFAULT_DATABASE_URL` hardcoded a connection string with credentials, host and port (`review_standards.md` Section 2, `testing_standards.md` Section 5) | Dead/duplicated configuration | RECOMMENDED (Phase E) | Replaced the literal with `_default_database_url()`, which composes the URL from `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_HOST` / `POSTGRES_PORT` — the same variables `docker-compose.yml` reads — over the named constants `COMPOSE_DEFAULT_CREDENTIAL` / `_HOST` / `_PORT`. `DATABASE_URL` remains the single override. Module docstring updated. |
| 2 | `backend/app/core/config.py:32` | `database_url` was a plain dataclass default, bound at import time, so `get_settings()`'s "read fresh from the environment" contract held for `cors_origins` but not for this field | Naming/contract consistency | RECOMMENDED (Phase E) | `database_url: str \| None = field(default_factory=_read_database_url)`, a named helper symmetric with the existing `_read_cors_origins`, whose docstring records why the plain default was wrong. |
| 3 | `backend/app/core/db.py:35` | `to_sqlalchemy_url` — a pure public transformation with four branches and the single point of failure for driver selection — had no unit test (`testing_standards.md` Section 1.1) | Test coverage | RECOMMENDED (Phase E) | Added `backend/tests/unit/test_db_unit.py`: driver URL untouched, `postgresql://` rewritten, `postgres://` rewritten, unknown scheme passed through. The fixture URLs deliberately carry no credentials — the function reads the scheme only. |
| 4 | `frontend/src/api/notesClient.ts` | The client's validation and error mapping was untested at every tier: `Notes.test.tsx` mocks the module wholesale and the E2E specs drive only the happy path | Test coverage | RECOMMENDED (Phase E) | Added `frontend/src/api/notesClient.test.ts` (10 cases) with a stubbed `globalThis.fetch`, so the real code runs: 201 happy path with `created_at` → `createdAt` mapping and request assertions, non-2xx carrying `{"detail": ...}`, non-2xx with an unparsable body, a rejecting `fetch`, a 2xx with an unreadable body, a malformed list element, a non-array list, a malformed single note, and the empty-list case. |

Findings 1 to 4 are Phase E's RECOMMENDED findings, carried in verbatim. All four were
applied in this pass; none was deferred.

**Behaviour preservation of finding 1, verified rather than assumed.** With no
`POSTGRES_*` and no `DATABASE_URL` set — CI's exact environment, since `pr-tests.yml`
exports neither for the pytest process — the composed fallback is
`postgresql+psycopg://tasknotes:tasknotes@localhost:5432/tasknotes`, byte-identical to the
constant it replaced. Residue, stated plainly: the shared development value `tasknotes`
still appears once, as the named default the compose file itself resolves
`${POSTGRES_USER:-tasknotes}` to. Removing it entirely would break the CI fallback, and it
is not a secret exposure — `docker-compose.yml` and `.env.example` commit the same value.
What is gone is the credential-bearing connection string, and the hardcoded host and port
with it.

**Consequence of finding 2, now live.** Coupling the lifespan to the setting
(`backend/app/main.py:36`) meant that on a machine with `DATABASE_URL` set at import time,
the `monkeypatch.delenv("DATABASE_URL")` in the pre-existing
`backend/tests/integration/test_version_integration.py:29` had no effect and the test
entered the `create_schema()` branch. It now takes effect and the test exercises the
warning branch it was written for. Confirmed on this machine, where `DATABASE_URL` is set.

## Not applied (OPTIONAL, informational only per Section 4)

| # | File | Finding | Category | Severity | Why not applied |
| - | ---- | ------- | -------- | -------- | --------------- |
| 5 | `e2e/tests/TEST-03_simple_note_form.spec.ts:17` | `let noteCounter = 0` is module-level mutable state shared between specs, which `testing_standards.md` Section 5 advises against; it is also redundant, since `Date.now()` plus six random base36 characters already make each note text unique | Dead code | OPTIONAL | OPTIONAL findings are informational under `refactoring_standards.md` Section 4. Beyond that, this gate's step 6 re-runs the unit and integration tiers only, so editing a Playwright spec here would ship a change whose only verification channel is not exercised until CI. |
| 6 | `frontend/src/api/notesClient.ts:57-70` | `readErrorDetail` leaves through three separate `return undefined` statements; one trailing return would read flatter | Excessive complexity | OPTIONAL | Subjective style. The explicit `catch { return undefined; }` is what documents that an unparsable error body is not itself worth surfacing — collapsing it would lose that signal. |
| 7 | `frontend/src/components/Notes.tsx:19-71` | Seven module-level `CSSProperties` constants, where `coding_standards.md` Section 3.1 prefers a utility CSS framework | File & component structure | OPTIONAL | The project ships no utility CSS framework, and `LandingPage.tsx` / `AppFooter.tsx` use exactly this inline-`CSSProperties` convention. Consistency with the sibling components is the better call; introducing a styling system is a project decision, not a refactor. |

## Checked and clean

No finding was raised in these categories, checked in the Section 3 order:

- **Naming consistency** — `snake_case` functions and modules, `PascalCase` classes,
  `UPPER_SNAKE_CASE` constants on the backend; `camelCase` and `PascalCase` components on
  the frontend. Test names follow `testing_standards.md` Section 3, including the two files
  added above.
- **DRY** — no duplicated logic. The trim-and-reject rule has one home
  (`note_service.create_note`); the schema deliberately does not repeat it; the frontend's
  own check is the AC2 requirement, not a duplicate. `Notes.test.tsx` and
  `LandingPage.test.tsx` both mock the notes client, for different reasons and with
  different return values — not extractable without coupling them.
- **Dead code** — no unused imports, variables or unreachable branches (except finding 5).
- **Excessive complexity** — no function over ~30 LOC, no nesting past two levels.
- **Layered-architecture drift** — none. The router only validates and injects, the service
  holds the one business rule, the repository holds all SQL, and no layer reaches past its
  neighbour.
- **Import hygiene** — no wildcard and no circular imports. The function-local
  `from app.models import note` inside `create_schema` (`db.py:102`) is the deliberate,
  commented break of the `Base` ↔ model cycle and is correct where it is.
- **File & component structure** — one component per file, file names matching, no
  multi-export modules.
- **No TODO/FIXME placeholders, no `print()` or `console.log()`** anywhere in the scope.

## Scope rules (Section 5) — all satisfied

1. No new features: two test files and two internals-only changes.
2. No API signature changes: paths, request and response shapes and status codes untouched.
3. No database migrations: `models/note.py` untouched.
4. Tests pass — see below.
5. No cross-module boundary changes.

## Test results after refactoring

| Suite | Command | Before | After |
| --- | --- | --- | --- |
| Backend (unit + integration) | `uv run pytest -q` in `backend/` | 26 passed | **30 passed** (4 added) |
| Frontend (Vitest) | `npm test` in `frontend/` | 18 passed | **28 passed** (10 added) |
| Frontend types | `npx tsc -b` in `frontend/` | clean | **clean** |

No regressions, so nothing was reverted (step 6). Integration tests ran against the sandbox
PostgreSQL on port 5442 via `DATABASE_URL`.

**Result: 4 RECOMMENDED findings applied, 3 OPTIONAL findings recorded for the PR
description.**
