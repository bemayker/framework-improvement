# Decisions (cross-cutting): deliver-20261030T185944Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261030T185944Z

- [run] Ingestion re-derived from ground truth after reset commit 8e90cb7: five tracker items at `to do` are the nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10); FEAT-1 and BUG-05 are `complete` and TEST-01..05 `done`, so the four leaves are ready and TEST-10 waits on TEST-08 and TEST-09.
- [run] BUG-01 kept as a node despite its stale tracker tag `mayker:to-verify`: status `to do` resolves to `todo`, and the server_time router is absent from main after the reset.
- [run] No map or registry write at ingestion: every node has a row and a registry entry; registered=none.
- [run] Planned order serializes TEST-09/BUG-01 (backend/app/main.py) and TEST-08/BUG-04 (LandingPage.tsx) from the map's shared-risk notes; round 1 dispatches TEST-09 (wave 2) and TEST-08 (wave 3, longer chain), leaving the third slot empty rather than co-dispatching a flagged pair.
- [run] Round 1 deviation from the ingestion plan: BUG-01 planned and built in parallel with TEST-09, because TEST-09's approved plan does not list backend/app/main.py, so the map note's serialization condition (both manifests list main.py) never held; the BUG-01 plan verdict confirmed the union manifests disjoint.
- [run] Merged TEST-09 (PR #421, squash 7781632), TEST-08 (PR #422, squash 5fecc80) and BUG-01 (PR #423, squash 73a10fd) on green CI and orchestrator merge verdicts; auto-Done succeeded for all three; BUG-01 took the to-verify arm (complete + tag mayker:to-verify) because its reproduction is deployed-only.
- [run] Test checkpoints passed after TEST-08 (head 5fecc80) and BUG-01 (head 73a10fd); TEST-09 not due.
- [run] Wave 2 boundary: follow-ups filed: none (TEST-09 known improvements are OPTIONAL only; no unaddressed comments). Re-ingest: 36 tracker tasks, all registered, registered=none, no map or registry write, 0 proposals.
- [run] TEST-10 held behind BUG-04: both rows flag frontend/src/components/LandingPage.tsx; BUG-04 goes first on the wave key (3 before 4). Third slot left empty rather than planning TEST-10 against a file BUG-04 is changing.
