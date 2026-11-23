# Decisions (cross-cutting): deliver-20261123T201421Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261123T201421Z

- [run] Ingestion: 52 items resolved (48 tracker, 4 local); nodes TEST-08, TEST-09, TEST-10, BUG-01, BUG-04; 40 cancelled items unmapped and dropped; scaffold TEST-01 done; registered=none.
- [run] BUG-01 carries mayker:to-verify on a todo status; the label counts only on done, so it is built as todo.
- [run] BUG-04 and TEST-10 take the full lifecycle: reset #963 reverted #959/#960, the tracker reads to do and no branch, PR or artifact survives.
- [run] Round 1 dispatch order: TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1) planned in parallel; BUG-04 waits for a free slot (Max parallel items 3). Build serialization pairs pending File Manifests: TEST-09/BUG-01 (main.py), TEST-08/BUG-04 and TEST-10/BUG-04 (LandingPage.tsx).
- [run] Plans for TEST-09, TEST-08 and BUG-01 ran in parallel. TEST-09's manifest does not list backend/app/main.py, so the TEST-09/BUG-01 serialization pair cleared and both built concurrently. TEST-08's manifest does not list LandingPage.tsx, so TEST-08/BUG-04 and TEST-10/BUG-04 cleared as well.
- [run] Merged: BUG-01 (#964, to_verify: deployed-only reproduction, tracker complete + mayker:to-verify), TEST-09 (#965), TEST-08 (#966). Checkpoints: BUG-01 pass at 7cb167b6, TEST-08 pass at 6f0d54e4; TEST-09 not due.
- [run] BUG-04 admitted to planning when BUG-01's slot freed (out of strict order only in that its wave-3 peers were already in flight); TEST-10 admitted once TEST-08 and TEST-09 merged.
- [run] Wave-2 boundary: follow-ups filed none (no RECOMMENDED finding left unapplied: BUG-01 had none, TEST-09 and TEST-08 applied theirs in the refactor gate; no comment unaddressed). Re-ingest: 52 items, nodes=TEST-10,BUG-04, registered=none, 0 wave and 0 checkpoint proposals.
- [run] Framework defect observed (reported, not filed): a builder found `bash /Users/.../.mayker/mayker-dev/hooks/lib/run-env.sh --probe 5183` refused three times by the permission layer while the `~/.mayker/...` spelling ran.
- [run] Wave-2 record published as PR #967. publish.sh first returned merge=refused while the required `changes` check was still pending; the PR was handed back to the script with `--pr` and it merged (arm=adopted merge=merged).
- [run] TEST-10 plan verdict revised once: LandingPage.test.tsx mocks fetchBackendVersion with the old return shape and was missing from the manifest. Re-plan added it (9 entries) and the re-check approved.
- [run] Merged: BUG-04 (#968). Repro before fail -> after pass. Checkpoint pass at 792aa04c. Wave 3 drained (BUG-01, TEST-08, BUG-04).
- [run] Wave-3 boundary: follow-ups filed none (BUG-04's review and refactor gate had no findings; no comment unaddressed). Re-ingest: 52 items, nodes=TEST-10, registered=none, 0 proposals. TEST-10's branch was cut at e1baa32a, one commit behind main; file sets disjoint from BUG-04.
- [run] Wave-3 record published as PR #969 (merged).
- [run] Merged: TEST-10 (#970), one commit behind main at merge (BUG-04's 792aa04c, disjoint files, provider CLEAN). Checkpoint pass at 6a195a42. Wave 4 drained.
- [run] Final boundary: follow-ups filed none (TEST-10's one RECOMMENDED finding applied by its gate; no comment unaddressed). Re-ingest: [item-status] items=52 nodes=0 done=11 to_verify=1 unmapped=40, registered=none. The graph is empty; the run proceeds to Section 8.
