Autonomous delivery run complete.

```
Delivered:  5 items merged (4 to Done, 1 to to_verify), 5 PRs, all squash (TEST-09 → https://github.com/bemayker/framework-improvement/pull/829 (done); BUG-01 → https://github.com/bemayker/framework-improvement/pull/828 (to_verify); TEST-08 → https://github.com/bemayker/framework-improvement/pull/830 (done); BUG-04 → https://github.com/bemayker/framework-improvement/pull/832 (done); TEST-10 → https://github.com/bemayker/framework-improvement/pull/833 (done))
No-pipeline merge: none (every delivered item merged on green checks, at least one each) — 7 of 7 checks green on each of the five PRs
Blocked:    0 items
Repro: BUG-01: Repro: not runnable locally: no edge cache or CDN exists locally, verify on the deployed environment: Prerequisites: BUG-01's PR is merged and deployed; you know the deployed API host (substitute it for <deployed-host>). / 1. Run curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time → two JSON bodies are printed. / 2. Compare the two now values → they differ. / 3. Run curl -si https://<deployed-host>/api/time (a GET; this route answers HEAD with 405) → headers include cache-control: no-store, and any CDN cache-status header does not report a HIT. / 4. Repeat step 1 twice more → every pair differs.; BUG-04: Repro: before fail -> after pass (npm --prefix frontend test -- src/components/NoteForm.test.tsx); n/a (not a defect item) for TEST-08, TEST-09, TEST-10
Awaiting verification: to-verify=BUG-01 (merged, awaiting verification on the deployed environment; depends on it: CHORE-06) — from `[next] 42 items, 42 with a known status`. CHORE-06 is cancelled in the tracker, so nothing live waits on it. BUG-01's PR body records `Deployed: not configured`: no deployed host is on record, so a human must supply one to run the Repro steps above.
Auto-Done: BUG-01: auto-done: run 44002352649 succeeded (item complete + mayker:to-verify, to-verify arm by the pipeline); TEST-09: auto-done: run 44002368783 succeeded; TEST-08: auto-done: run 44002906098 succeeded; BUG-04: auto-done: run 44004164088 succeeded; TEST-10: auto-done: run 44004892433 succeeded. No backstop flip.
Dispatch stalls: none (no dispatch stalled: no failure notification arrived)
Fallback wakeups: none scheduled (waiting policy 2.1: background dispatches are awaited by notification)
Run ended: complete (the graph is empty) — emptied at the final boundary (item-status.sh items=42 nodes=0 done=11 to_verify=1 unmapped=30); nothing blocked
Next session: none (the run did not end on a handover)
Comments unaddressed at merge: none — every item: 0 PR inline or conversation comments, 0 reviews; tracker: no new comment since 6.1
Item-to-PR link: all posted (5 of 5 tracker items) — ClickUp comments on BUG-01, TEST-09, TEST-08, BUG-04, TEST-10
Gate verdict: all asserted (5 of 5 items recorded a verdict for every push). BUG-01: test-gate: verdict recorded for this push (head 22abdef: full after 3s; counts: root: pytest 51 passed, 0 failed, 14 skipped + vitest 26 passed, 0 failed, 0 skipped; ...); TEST-09: (head 495fd5d: full after 3s; pytest 52 passed, 0 failed, 14 skipped + vitest 26 passed, 0 failed); TEST-08: (head 35de833: full after 2s; pytest 42 passed, 0 failed, 14 skipped + vitest 35 passed, 0 failed); BUG-04: (head 25030da: full after 2s; pytest 75 passed, 0 failed, 0 skipped + vitest 40 passed, 0 failed); TEST-10: (head ba4f3e7: full after 3s; pytest 61 passed, 0 failed, 14 skipped + vitest 43 passed, 0 failed)
Review closure: TEST-08: B1 (README .env.example row edited outside the plan, wrong once TEST-09 lands): fixed (re-pass 1). BUG-01, TEST-09, BUG-04, TEST-10: no BLOCKING finding.
Refactor gate: BUG-01: no findings (8 files examined); TEST-09: no findings (10 files examined); TEST-08: 2 improvements applied (14 files examined; both RECOMMENDED review findings applied); BUG-04: no findings (2 files examined); TEST-10: no findings (7 files examined)
Environment: none (every item's backing services were declared) — BUG-04: `- env: service=postgres container=BUG-04-db` from the declared Backing Services recipe (derived=no), torn down at 6.10. No other item provisioned a service; no derived=yes line.
Handover rebuild: BUG-01: rebuilt from 22abdef7, health=pass, 10s, as Compose project framework-improvement-bug-01-handover | TEST-09: rebuilt from 495fd5d9, health=pass, 9s, as Compose project framework-improvement-test-09-handover | TEST-08: rebuilt from 35de8339, health=pass, 11s, as Compose project framework-improvement-test-08-handover | BUG-04: rebuilt from 25030da3, health=pass, 11s, as Compose project framework-improvement-bug-04-handover | TEST-10: rebuilt from ba4f3e7a, health=pass, 11s, as Compose project framework-improvement-test-10-handover. All five stacks are left running for testers; stop each with `docker compose -p <project> down`. (Service names and URLs were not handed to this report.)
CLAUDE.md discovery: not run (this run skipped Section 2: .claude/project_state.json already existed) — Project Mode is new
Feature ID write-back: not run (this run skipped Section 2: .claude/project_state.json already existed) — 0 written; registered=none at all three ingests
Default branch protection: not run (this run skipped Section 2: .claude/project_state.json already existed) — protection was not read this run
Waves: assigned: wave 1 = TEST-01; wave 2 = TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, FEAT-1, TEST-09, TEST-13, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10, FEAT-12, FEAT-14; wave 3 = TEST-08, BUG-01, BUG-02, TEST-11, BUG-04, CHORE-01, TEST-12, BUG-05, FEAT-9, FEAT-11, FEAT-13, BUG-06; wave 4 = TEST-10, CHORE-02, TEST-14, FEAT-2, CHORE-05, FEAT-3, CHORE-06; wave 5 = BUG-03, CHORE-03, CHORE-04, TEST-15, FEAT-6, CHORE-1 (0 unwaved; 42 items, 5 populated waves) — authored before this run and left untouched, 0 proposals at any ingest — an ordering key only; no item was ever held back because a lower wave was unfinished. This run's nodes: TEST-09 (wave 2); TEST-08, BUG-01, BUG-04 (wave 3); TEST-10 (wave 4).
Shared risk: not run (no row's shared_risk_notes cell was empty, so nothing was inferred — every note on this map is an earlier run's or a human's). 0 inferred, 0 written. Section 5 step 2 serialized 0 pairs in the end: the three holds planned at ingest (TEST-08 and BUG-04, TEST-10 and BUG-04 on frontend/src/components/LandingPage.tsx; TEST-09 and BUG-01 on backend/app/main.py) were each released on a union-of-phases File Manifest comparison, and no two in-flight items shared a file.
Test checkpoints: flagged among this run's items: BUG-01, TEST-08, BUG-04, TEST-10 (✅ on the map before this run; 0 proposed at any ingest); TEST-09 declined (➖), not due
                  fired: BUG-01: uv run --directory backend pytest -q && npm --prefix frontend test on 2410428f — PASSED | TEST-08: same command on 82b14518 — PASSED | BUG-04: same command on 109b927f — PASSED | TEST-10: same command on 434df4df — PASSED
Run publish: wave-2: PR https://github.com/bemayker/framework-improvement/pull/831 — merged (`[publish] arm=opened branch=chore/mayker-deliver-20261117T020310Z-wave-2 pr=https://github.com/bemayker/framework-improvement/pull/831 merge=merged`) | wave-4: PR https://github.com/bemayker/framework-improvement/pull/834 — merged (`[publish] arm=opened branch=chore/mayker-deliver-20261117T020310Z-wave-4 pr=https://github.com/bemayker/framework-improvement/pull/834 merge=merged`) | report: appended by the session after this report is published
Unmerged-green: none (no item ended green and unmerged)
Follow-ups filed: none (no follow-up source fired) — sources read for all five merged items: known-improvements held OPTIONAL findings only (BUG-01 1, TEST-09 1, BUG-04 1, TEST-10 3; TEST-08 none open), which are never a source; unaddressed-comments: none
Repositories created: none
Pipelines created or fixed: none
Decisions of note: 27, this run section only (see DECISIONS.md, the per-item decisions.md under .claude/artifacts/, and the decisions file of each merged item under docs/runs/deliver-20261117T020310Z/, holding the entries after its final push). Of note: TEST-08 honoured the tracker correction (version read from GET /api/version at runtime; loading and failure read exactly "Task Notes"; no backend file changed because TEST-05 already ships the endpoint). BUG-01 recreated FEAT-1's missing /api/time route (a sandbox reset removed it) as an assumed scope change. BUG-04's criteria were derived from its title (the item has no description). TEST-10's criterion-2 reading is recorded. TEST-10 changed LandingPage.test.tsx outside its manifest (a one-line mock, named in its PR). Earlier-run PRs #818, #819, #820, #822, #824 were not treated as resume evidence, because #827 reset the code.
Standards provenance: both always-on standards self-reported as read by 18 of 39 per-item dispatches across the run (BUG-01 3 of 7; TEST-09 4 of 7; TEST-08 4 of 9; BUG-04 3 of 8; TEST-10 4 of 8); 0 unbacked provenance claims, 0 MISMATCH lines anywhere; all counts self-reported | no pass bar on the read count
Artifacts not written: none so far (the session appends any MISSING the report publish prints)
Refusals: [refusals] transcript=... dispatches=48 refusals=9; main: 1 (bash-shape-guard plugin-read: grep of the build-feature references; read with Read instead); orchestrator ingest: 1, orchestrator wave-2 re-ingest: 1, orchestrator final re-ingest: 1 (each bash-shape-guard plugin-read on a grep of feature-map-propose.sh; usage read with Read instead); builder BUG-01 Phase B: 1 (standards-gate refused a commit: ruff lint on an unused `import os` in main.py; fixed and committed); builder TEST-08 Phase D: 2 and builder BUG-04 Phase D: 2 (permission denied: `run-env.sh --probe 5183/8010`, a shipped helper call refused by the permission layer — a framework defect, to report to the framework maintainers, not into this project's tracker)
Unattended check: .claude/artifacts/run/deliver-run.json, state complete — written by run-dir.sh, not by this session; a headless caller reads that file rather than any line above

Re-run /deliver at any time: it resumes blocked and in-flight items
and picks up new backlog items; merged work is never redone.
```

## Left for a human

- **BUG-01 verification:** it is merged and marked complete with `mayker:to-verify`. Its reproduction cannot run locally, and no deployed host is configured, so someone has to run the four `Repro:` steps above against the deployed API.
- **Framework defect:** `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --probe {port}` was refused by the permission layer four times (builder Phase D on TEST-08 and BUG-04). Report it to the framework maintainers.
- **Open PR #84** (`chore/fixture-plan-review`) belongs to no item and was left as found.
- **Remote branches:** the heads of the five merged branches (feature/BUG-01, BUG-04, TEST-08, TEST-09, TEST-10) remain on the remote. They are not resume evidence.
- **Handover stacks:** five Compose projects are still running (names on the `Handover rebuild:` line).

## Run statistics

Source: `.claude/artifacts/run/stats_summary.md`, generated 2026-11-17 02:46 UTC. Token metrics: available. Skill load: read. The summary carries no `**Degraded:**` and no `**Collector failed:**` line. Run-level table only; no per-item table is embedded, because the 48 subagent transcripts belong to the run unit and not to any single work item. The tracked copies are published at `docs/runs/deliver-20261117T020310Z/run-stats_summary.{json,md}` on the default branch.

### Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 42m53s | 559 | 1135 | 2.3 | 17 | 408.5K |  | 501.1K |  | 0.962 | claude-opus-5-5 | 84/84/280 (exec 81% of wall) | 4.08/2.14/1.86 |  |

Wall is this run's last step end minus its first step start; steps sum to 42m53s.

Exec turns took 34m46s of round trip (command plus model time, ADR 0006 section 2): 81% of wall.

CI wait: 7m28s in `ci-poll.sh` calls; framework wall (wall less CI wait) 35m24s.

Subagent dispatches: 48 in `deliver` (mayker-dev:builder 24, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 6): median ctx max 63.4K, peak 110.8K, 0 above the auto threshold (80% of the serving model's window).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that served it. No cost is estimated (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design; add the row to hooks/lib/model-windows.tsv once it has been checked.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
