# UAT script, FEAT-3: Notes longest body length endpoint

This feature has no UI. Every criterion is an API behaviour, verified with HTTP calls from a terminal (or the FastAPI docs page at http://localhost:8010/docs, "Try it out"). Each `curl -i` prints the status line first and the JSON body last; curl prints JSON without spaces, this script writes it spaced.

## Prerequisites

- Docker is installed and running.
- From the repo root run `docker compose up -d --build`; the backend answers at http://localhost:8010 (the port in `docker-compose.yml`).
- `curl` is available.
- Steps run in order: Criterion 1 empties the notes table, Criterion 2 and 3 build on it. Running these steps deletes every stored note, so use a throwaway database.

## Criterion 1: with no notes stored, GET /api/notes/longest-length returns 200 and its max_length field is 0

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -s http://localhost:8010/api/notes` and note every `id` in the list (it may be `[]` already). | A JSON list. | [ ] | [ ] |
| 1.2 | For each id from 1.1, run `curl -i -X DELETE http://localhost:8010/api/notes/<id>`. | `HTTP/1.1 204 No Content` for each. | [ ] | [ ] |
| 1.3 | Run `curl -s http://localhost:8010/api/notes`. | `[]` | [ ] | [ ] |
| 1.4 | Run `curl -i http://localhost:8010/api/notes/longest-length`. | `HTTP/1.1 200 OK` and body `{"max_length": 0}`. | [ ] | [ ] |

## Criterion 2: after creating notes with bodies "ab" and "cde", its max_length field is 3

Prerequisite: Criterion 1 just ran, so the notes table is empty.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" --data-binary @-`, type the line `{"text": "ab"}`, then press Ctrl-D. | `HTTP/1.1 201 Created`, body with text `ab` and a numeric `id`. | [ ] | [ ] |
| 2.2 | Repeat 2.1 with the line `{"text": "cde"}`. Write down the returned id as CDE_ID. | `201 Created`, body with text `cde` and a larger `id`. | [ ] | [ ] |
| 2.3 | Run `curl -i http://localhost:8010/api/notes/longest-length`. | `HTTP/1.1 200 OK` and body `{"max_length": 3}`. | [ ] | [ ] |

## Criterion 3: the route does not shadow GET /api/notes/{id}; the full backend test suite passes with the new tests included

Prerequisite: Criterion 2 just ran and CDE_ID is known.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -i http://localhost:8010/api/notes/longest-length`. | `HTTP/1.1 200 OK` and body `{"max_length": 3}`, never a 422 that names `note_id`. | [ ] | [ ] |
| 3.2 | Run `curl -i http://localhost:8010/api/notes/<CDE_ID>`. | `HTTP/1.1 200 OK` and a body with that id and text `cde`. | [ ] | [ ] |
| 3.3 | Run `curl -i http://localhost:8010/api/notes/abc`. | `HTTP/1.1 422 Unprocessable Entity`, whose detail names the path parameter `note_id` (unchanged behaviour). | [ ] | [ ] |
| 3.4 | With a PostgreSQL reachable for the integration tests, run the test gate command from the repo root: `uv run --directory backend pytest -q && npm --prefix frontend test`. | pytest reports `0 failed` (it runs `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py` with the rest of the suite), and Vitest reports `0 failed`. | [ ] | [ ] |

## Summary

| Criterion | Steps | Result (Pass / Fail) |
|-----------|-------|----------------------|
| 1: empty table gives max_length 0 | 1.1 to 1.4 | |
| 2: notes "ab" and "cde" give max_length 3 | 2.1 to 2.3 | |
| 3: no shadowing, suite passes | 3.1 to 3.4 | |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail

Notes:
