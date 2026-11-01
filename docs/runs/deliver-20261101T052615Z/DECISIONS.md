# Decisions (cross-cutting): deliver-20261101T052615Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261101T052615Z

- [run] Ingested 37 ClickUp tasks + 5 local items; 4 graph nodes (TEST-09, TEST-08, BUG-04, TEST-10). BUG-01 excluded as to_verify via the mayker:to-verify tag: merged work awaiting deployed-environment verification, not buildable work.
- [run] No registry or map write: every tracker task is registered, the proposal helper returned 0/0, every node cell is authored. No Section L register publish before the first dispatch.
- [run] Round 1 dispatches TEST-09, TEST-08, BUG-04 for planning in parallel; BUG-04's build is serialized behind TEST-08 on the authored LandingPage.tsx shared-risk note unless the File Manifests prove the pair disjoint. TEST-09 is disjoint (backend only).
- [run] BUG-04's tracker description is empty (no acceptance criteria); the planner records its assumptions, and the plan verdict checks they stay inside "a note saved twice quickly is stored once".
- [run] Merged: TEST-09 PR #448 (37d7357), BUG-04 PR #449 (623c510), TEST-08 PR #450 (ca763f6), each on an orchestrator merge verdict, all checks green, auto-Done succeeded for each. Checkpoints on BUG-04 and TEST-08 passed on the integrated main.
- [run] Wave boundary: wave 2 (TEST-09) drained before wave 3 did, and Section W ran once here, after wave 3 (BUG-04, TEST-08) drained, covering both. Deviation from running it at each boundary; nothing was lost, because no follow-up source fired in either wave.
- [run] Follow-ups: none filed. known-improvements: TEST-09 none; BUG-04 its one RECOMMENDED finding applied by the refactor gate; TEST-08 only an OPTIONAL finding (excluded by rule). unaddressed-comments: none on any merged item.
- [run] Concurrent Phase D smoke runs collide on the app's fixed ports 5183 and 8010 (Playwright and Vite configs, the CORS default). TEST-08's first smoke run could not execute while BUG-04's held them; re-dispatched once the ports were free, 7 passed. Framework-level observation for the maintainer, not a project follow-up.
- [run] Re-ingestion at the wave-3 boundary: 37 tracker tasks re-read, 2 non-terminal. TEST-10 is the sole remaining node and is ready (TEST-08 and TEST-09 merged this run); BUG-01 stays excluded as to_verify. Local items all done. registered=none, no map or registry write, so no register publish precedes the next round.
- [run] TEST-10 dispatches alone from 6.1 with no hold: its noted shared-risk partners BUG-04 (complete) and CHORE-02 (cancelled) cannot run concurrently.
