# Decisions (cross-cutting): deliver-20261022T175613Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261022T175613Z

- [run] Graph built from the session's tracker probe plus local frontmatter: 5 open nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10), 8 done and 19 cancelled dropped; two edges remain (TEST-08→TEST-10, TEST-09→TEST-10), no cycle.
- [run] No map row added and no registry entry written: all five open items already hold a row and a features entry, so registered=none and no pre-dispatch register publish.
- [run] Proposal re-run accepted as-is: 0 wave and 0 checkpoint proposals because every open row's authored cells are filled.
- [run] BUG-01's empty shared_risk_notes cell inferred over and left empty: its fix is confined to routers/server_time.py, disjoint from every other open item.
- [run] Round-1 schedule TEST-09 ∥ TEST-08 ∥ BUG-01: wave 2 first, then wave 3 by chain length (TEST-08 chain=2 over BUG-01 and BUG-04 chain=1); BUG-04 held on the TEST-08/BUG-04 LandingPage.tsx shared-risk pair and the cap.
- [run] Every open node resumes at Section 6.1: no branch, PR, artifact or worktree exists for any of them.
- [deliver-20261022T175613Z] 5.2: TEST-08, TEST-09 and BUG-01 dispatched concurrently: union File Manifests are pairwise disjoint (frontend footer/API client vs backend version endpoint+config vs server_time router); TEST-08 consumes the /api/version contract TEST-09 extends, but reads only the unchanged "version" field, so merge order is free.
- [deliver-20261022T175613Z] 5.2: BUG-04 held until TEST-08 merges: the map flags the pair on frontend/src/components/LandingPage.tsx; TEST-08's plan narrows the overlap to LandingPage.test.tsx and possibly frontend/src/api/notes.ts, both still shared, so BUG-04 plans against post-TEST-08 main.
- [deliver-20261022T175613Z] W.1: wave 2 boundary; follow-ups filed: none (TEST-09, BUG-01, TEST-08 known improvements are all OPTIONAL; TEST-08's two RECOMMENDED findings were applied by its refactor gate; no comment left unaddressed).
- [deliver-20261022T175613Z] TEST-08: first push's pr-tests aggregate job stalled on GitHub (all steps complete, job never closed); gh run rerun refused for the token (Resource not accessible by personal access token); re-triggered once with an empty commit, green on 482693a.
- [W.2 re-ingest] Graph rebuilt at the wave 2 boundary: 2 open nodes (BUG-04, TEST-10), no edges between them, no cycle; TEST-08/TEST-09 done and BUG-01 to_verify all satisfy their dependants, so both nodes are ready by the Section 3 invariant.
- [W.2 reconcile] No map row or registry entry added (registered=none); propose.sh 0/0; shared-risk inference found no empty cell on an open row; map validates. No register publish required.
- [W.2 schedule] BUG-04 dispatched alone (wave 3 before wave 4). TEST-10 held on the flagged LandingPage.tsx pair with BUG-04; release at BUG-04's merge, or at BUG-04's plan verdict if the approved manifest is disjoint from the footer files.
- [W.2 resume] Both nodes resume at 6.1: no branch, PR, artifact or worktree exists for either.
- [deliver-20261022T175613Z] W.3: wave-2 record published: PR #277 merged (b2bd3d7), arm=opened merge=merged. Whether pr-tests was a required check at merge time: not readable (branch protection read refused for the token: HTTP 403 Resource not accessible by personal access token).
- [deliver-20261022T175613Z] 5.2: TEST-10 released alongside BUG-04. BUG-04's union File Manifest (NoteForm.tsx, NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts, e2e/uat/scenarios|scripts/BUG-04_*, .claude/artifacts/BUG-04/uat_script.md) is disjoint from TEST-10's surface (LandingPage.tsx, AppFooter.tsx, frontend/src/api/version.ts and their tests); the feature_map.md shared-risk pairing on LandingPage.tsx did not materialize because the approved plan leaves LandingPage.tsx untouched.
- [deliver-20261022T175613Z] 5.2: TEST-10 dispatched concurrent with BUG-04 — union File Manifests share no path (TEST-10: version client, AppFooter, LandingPage test, TEST-08 E2E spec; BUG-04: NoteForm and its test only); the LandingPage.test.tsx overlap shared_risks.md calls plausible is absent from BUG-04's manifest.
- [deliver-20261022T175613Z] W.1 (final boundary, wave 4): follow-ups filed: none (BUG-04's and TEST-10's known improvements are all OPTIONAL; no comment left unaddressed).
- [deliver-20261022T175613Z] FINAL boundary re-ingest: 28 tracker tasks (9 complete, 19 cancelled, 0 open) + 5 local items (all done) → 0 graph nodes, 0 dispatchable; run drains to the report.
- [deliver-20261022T175613Z] BUG-01 is complete + mayker:to-verify (merged #274, deployed-environment verification outstanding): dropped from the graph as to_verify; left for a human on the report's to-verify line.
- [deliver-20261022T175613Z] Map reconcile at FINAL: no rows added, 0 wave/checkpoint proposals, 0 shared-risk inferences; registered=none.
- [deliver-20261022T175613Z] TEST-10 refactor-gate dispatch wrote a stray untracked duplicate .claude/artifacts/TEST-10/refactor_report.md into the primary checkout; its removal was refused (sensitive file), so the post-merge git pull --ff-only aborted and TEST-10's full-suite checkpoint could not run (head-not-integrated). The primary checkout is left at c21944e, behind origin/main ffb9ba8. Human remedy: delete that file, then git pull --ff-only.
- [deliver-20261022T175613Z] W.3: wave-4 record published: PR #280 merged, arm=opened merge=merged, cut-from=HEAD (primary checkout stale at c21944e, base named: c21944e not main tip). Whether pr-tests was a required check at merge time: not readable (branch protection read refused for the token, HTTP 403).
