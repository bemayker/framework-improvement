# Decisions (cross-cutting): deliver-20261108T022141Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261108T022141Z

- [run] Ingestion: five nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10), all todo, all at Section 6.1: reset #652 (81e1e8f to 36e231a) removed the code and artifacts of the previous run's five merges (#645-#649) and the tracker reads to do, so the prior work is not resumable and is rebuilt in full.
- [run] label-ignored=BUG-01 (mayker:to-verify on to do: the label counts only on done, so the item reads as todo and is built, MDF-515).
- [run] unmapped=30 items at cancelled: cancelled maps to null in reverse_status_mapping, so none is a node.
- [run] Map reconcile: no row added, no registry entry written, 0 wave and 0 checkpoint proposals, 0 shared-risk cells inferred; map validates as-is, not rewritten.
- [run] Serialization: BUG-01 build held behind TEST-09 when both manifests list backend/app/main.py; BUG-04 build held behind TEST-08 on LandingPage.tsx. Dispatch order TEST-09, TEST-08, BUG-01, then BUG-04, then TEST-10 (wave, then chain length).
- [run] Merges this run: TEST-09 #654 (d54252d), BUG-01 #653 (6aefac4, to_verify), TEST-08 #655 (a765934), BUG-04 #656 (6867eb7), TEST-10 #657 (194da25); each merge on the orchestrator's verdict, all five autonomy.md Section 5 conditions met; full-suite checkpoint passed after BUG-01, TEST-08, BUG-04 and TEST-10 (TEST-09 not due).
- [run] Dispatch order taken: TEST-09, TEST-08, BUG-01 first (wave order), BUG-04 on the first free slot after BUG-01 and TEST-09 merged, TEST-10 once TEST-08 and TEST-09 were done. No serialization hold was needed: the plan verdicts found no manifest overlap (TEST-09/BUG-01 on main.py, TEST-08/BUG-04 and TEST-10/BUG-04 on LandingPage.tsx did not materialize). No Phase D was held: the smoke runs never overlapped.
- [run] Final boundary (Section W): follow-ups filed none (known-improvements: no merged PR lists an unapplied RECOMMENDED finding; unaddressed-comments: none). Re-ingestion: 42 items read (38 tracker, 4 local), nodes=0 done=11 to_verify=1 unmapped=30 (all cancelled); backlog drained; registered=none; map unchanged.
- [run] BUG-01 reads to_verify (tracker complete + mayker:to-verify); the human deployed check of criterion 3 on <deployed-host> is the only open action.
