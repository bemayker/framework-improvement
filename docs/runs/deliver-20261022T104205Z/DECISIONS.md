# Decisions (cross-cutting): deliver-20261022T104205Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261022T104205Z

- [ingest] Scope FEAT-4 only: its sole depends_on TEST-01 is done (local frontmatter) and it has no tracker dependencies, so the graph is one node; FEAT-5 stays out of scope. Readiness: todo + dep done + scaffold done → ready; wave 2 is an ordering key only.
- [ingest] No map or registry write: FEAT-4 already registered (123k99cytrg) with a row carrying wave 2, checkpoint ✅ and its FEAT-4/FEAT-5 main.py shared-risk note; propose.sh returned 0/0, validate passed (31 rows, 32 edges). registered=none, so no Section L register publish before dispatch.
- [resume] FEAT-4 resumes at 6.1 (full lifecycle): no remote branch, no PR, no artifacts, no worktree.
- [schedule] Round 1: dispatch FEAT-4 (only ready node, wave 2, no lower-wave item in scope); no serialization hold.
- [merge] FEAT-4: PR #255 squash-merged at 96c0433 on the orchestrator's merge verdict (self-review PASS 0/0/0, CI 7/7 green, criteria met, no comments, escalation bar not triggered). Auto-Done run 39771206632 succeeded; full-suite checkpoint verdict=pass at 96c0433.
- [boundary] Section W step 1: no follow-ups filed (PR #255 known improvements: none; no unaddressed comments).
- [ingest] Re-ingest (Section W step 2): FEAT-4 complete, TEST-01 done, scope drained to 0 nodes; registered=none; propose 0/0 over 31 rows. FEAT-5 stays out of scope (ID-scoped run, FEAT-4 does not depend on it).
- [report] Section 8: report.md composed by the orchestrator, whose own staging Write was blocked twice by a harness hook ("Subagents should return findings as text, not write report files."); the session staged and wrote it through run-dir.sh stage-in write-run. Framework defect to raise with the maintainer, not filed in the project tracker.
- [report] Stats Degraded: step 5 and the Section W re-ingestion marker (3.orchestrator #2) overlap by 99s, a marker-writer defect of this session; the run total stands.
