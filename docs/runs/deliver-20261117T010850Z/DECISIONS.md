# Decisions (cross-cutting): deliver-20261117T010850Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261117T010850Z

- [ingest] run=deliver-20261117T010850Z nodes=5 (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10) from item-status.sh (items=12 done=7 to_verify=0 unmapped=0 link=0). Cancelled tracker items were not passed to the helper: none is a dependency of a node.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a node and is built.
- [ingest] TEST-02 exists in both the tracker and docs/issues/; hybrid resolves it from the tracker (complete, done). The local file also reads done, so there is no contradiction.
- [ingest] Map reconcile: no row added, registered=none. feature-map-propose.sh returned 0 wave and 0 checkpoint proposals over 42 rows; the map validates as it stands.
- [ingest] Cycles: none; no edge dropped.
- [schedule] Ready order TEST-09 (wave 2, chain 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1), BUG-04 (wave 3, no chain). The third slot goes to BUG-01; BUG-04 is held behind TEST-08 on the LandingPage.tsx shared-risk note.
- [schedule] TEST-09 and BUG-01 serialization is conditional on both File Manifests listing backend/app/main.py; decided at build dispatch from the plans.
- [schedule] TEST-10 (wave 4) is serialized after BUG-04 (wave 3) on the LandingPage.tsx note when both are ready.
- [resume] All 5 nodes: full lifecycle from 6.1. No feature branch on the remote, no open PR for a node, no plan artifact, no worktree.
- [schedule] BUG-01 and TEST-09 plans self-approved; whole-feature File Manifests share 0 paths (TEST-09 12, BUG-01 10), so their builds run concurrently. TEST-09 does not touch backend/app/main.py; the map's conditional hold does not fire.
- [schedule] BUG-04 stays serialized behind TEST-08; basis corrected from LandingPage.tsx (not in TEST-08's manifest) to frontend/src/components/LandingPage.test.tsx and frontend/src/api/notes.ts. Both are in TEST-08's whole-feature file set and plausibly in a double-submit fix; BUG-04 has no File Manifest to clear the overlap, and the hold costs no slot at concurrency 3.
- [merge] BUG-01 merged: PR #818 squash ee10116; auto-done run 43995596586 succeeded; item reads complete + mayker:to-verify (awaiting deployed verification). Checkpoint due=yes verdict=pass head=27c3d0eb.
- [merge] TEST-09 merged: PR #819 squash 27c3d0e; auto-done run 43995606183 succeeded; item reads complete.
- [wave] Wave 2 boundary: follow-ups filed none (known-improvements sources held OPTIONAL findings only on BUG-01 and TEST-09; no unaddressed comments).
- [ingest] Wave-2 boundary re-ingest: graph is 3 nodes (TEST-08, BUG-04, TEST-10) from item-status.sh over 42 items (done=8 to_verify=1 unmapped=30, all cancelled). registered=none; no map or registry write; 0 wave and 0 checkpoint proposals.
- [schedule] BUG-04 planning dispatched while TEST-08 is at merge: plans only write .claude/artifacts/BUG-04/, so the TEST-08 serialization applies to its build, not its plan.
- [schedule] TEST-10 is blocked by TEST-08 alone now that TEST-09 is done; its LandingPage.tsx risk against BUG-04 is confirmed on the File Manifests once both plans exist.
