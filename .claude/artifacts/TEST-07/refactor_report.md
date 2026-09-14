# Refactor gate report: TEST-07 (Uptime endpoint)

- Run: deliver-20260914T095103Z
- Branch: feature/TEST-07-uptime-endpoint
- Standard: refactoring_standards.md (one pass, after the Phase E self-review)
- Review verdict this pass consumes: `PASS blocking=0 recommended=2 optional=2`
- Files created by this gate: **none**

## Mandatory input: the self-review's RECOMMENDED findings

| # | File | Finding | Category | Severity | Change applied |
| - | ---- | ------- | -------- | -------- | -------------- |
| 1 | `e2e/uat/scripts/TEST-07_uptime_endpoint_uat_script.md`, `.claude/artifacts/TEST-07/uat_script.md` | UAT steps 4.2 and 4.3 told the tester `started_at` shows `format: date-time`; the generated schema does not | Documentation accuracy (review input) | RECOMMENDED | **Applied** — both steps rewritten to describe the schema as generated, in both copies (kept byte-identical, verified with `diff`) |
| 2 | `backend/tests/unit/test_uptime_unit.py:69` | `assert response.started_at is uptime_module.STARTED_AT` couples a correct implementation to an undocumented pydantic internal | Test robustness (review input) | RECOMMENDED | **Applied** — `is` changed to `==`; the comment above it now argues for equality against the import-time constant instead of for identity |

### Finding 1: what the OpenAPI probe actually showed

Settled by running, not by reading:

```
uv run --directory backend python -c 'import json; from app.main import create_app; print(json.dumps(create_app().openapi()["components"]["schemas"]["UptimeResponse"], indent=2))'
```

`started_at` came back as:

```json
"started_at": {
  "type": "string",
  "title": "Started At"
}
```

**No `format` key.** The reviewer's mechanism was correct: `backend/app/schemas/uptime.py:23-24` declares `@field_serializer("started_at")` annotated `-> str`, and pydantic derives a field's serialisation-mode JSON schema from the serializer's return type. FastAPI documents a response model in serialisation mode, so `AwareDatetime`'s `format: date-time` never reaches the generated schema. `uptime_seconds` is unaffected and keeps `"minimum": 0.0`.

So the ABSENT arm applied: the UAT claim was false and the documents were corrected. **The serializer was not touched.** The wire format is already what criterion 3 requires (`2026-09-14T09:51:03.412876+00:00`, explicit offset, never `Z`), and rewriting working code so a document reads true would be the wrong direction.

**No test was added to pin the absence, deliberately.** An assertion that `format` is *missing* would pin a pydantic implementation detail in the opposite direction — a future release that reinstated the format would redden a correct implementation, which is exactly the coupling finding 2 exists to remove. The claim that is worth pinning is the wire format, and `test_uptime_response_serialises_started_at_with_an_explicit_utc_offset` (unit) plus `test_get_uptime_serialises_started_at_in_utc_with_an_explicit_offset` (integration) already pin it.

**Carried to the PR as an observation, not acted on:** the generated schema being weaker than the wire value is a real, if cosmetic, documentation gap. Closing it would mean giving the serializer a JSON-schema override (for example `@field_serializer(..., when_used="json")` plus an explicit `json_schema_extra`), which is a behaviour-adjacent change to an already-reviewed source file and therefore outside this gate's scope rules.

## Section 3 checklist over this dispatch's files

Ran over `backend/app/schemas/uptime.py`, `backend/app/routers/uptime.py`, `backend/tests/unit/test_uptime_unit.py`, `backend/tests/integration/test_uptime_integration.py` and the two UAT documents. No finding of the gate's own:

| # | Category | Result |
| - | -------- | ------ |
| 1 | Naming consistency | Clean. `snake_case` functions, `UPPER_SNAKE_CASE` module constants (`STARTED_AT`, `STARTED_AT_MONOTONIC`), `PascalCase` model, file names match the `test_{module}_{tier}.py` convention in `CLAUDE.md`. |
| 2 | DRY violations | None. The two clock reads answer different questions and are commented as such; the fake-clock helpers in the unit tier are two distinct behaviours, not a duplicate. |
| 3 | Dead code | None. Every import in all four modules is used. |
| 4 | Excessive complexity | None. The handler is one expression; no branching anywhere in the feature. |
| 5 | Layered-architecture drift | The absent `app/services/uptime_service.py` is the deviation from `coding_standards.md` Section 2.2 already recorded in the plan and the PR description, on the Architecture Notes rule "Keep every feature as small as possible". Introducing a pass-through service here would be gold plating and a behaviour-adjacent restructure of reviewed code; not touched. |
| 6 | Import hygiene | Clean. No wildcard, no cycle, no reach into another module's internals. |
| 7 | File & component structure | Clean. One schema per module, router registered once in `app/main.py`. |

No extraction, split or new file was warranted, so none was made (Section 3: a file is created only to apply a RECOMMENDED finding that cannot be applied otherwise, and neither of these two needed one).

## Scope rules (Section 5)

1. No new features. 2. No API signature change — path, status codes and the two response keys are byte-identical; the only source file touched is a unit test. 3. No migrations. 4. Tests pass (below). 5. No cross-module boundary change.

## Test results after the gate

| Tier | Command | Result |
| ---- | ------- | ------ |
| Unit | `uv run --directory backend pytest -q tests/unit` | 48 passed, 0 failed |
| Integration | `uv run --directory backend pytest -q tests/integration` | 39 passed, 0 failed |

No regression, so no revert.

## Not this gate's work

The two OPTIONAL findings (per-process import-time capture under a hypothetical multi-worker launch; the `Then` step at `e2e/uat/scenarios/TEST-07_uptime_endpoint.feature:46` not observable from its `When`) are informational and go to the PR description unfixed, per `review_standards.md` Section 6.3.
