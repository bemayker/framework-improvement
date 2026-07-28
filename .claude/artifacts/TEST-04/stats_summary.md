# Run statistics, TEST-04

Generated 2026-07-28 12:40 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 overlapping step window pair(s) detected; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. One stats.jsonl per concurrent unit is the invariant.

**Overlapping windows:** plan-feature step 11 and plan-feature step 12 overlap by 439s.

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | Update Status Planning | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Create Branch | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read References | 2m01s | 3 | 14 | 4.67 | 6 | 12 | 100.5K | 105.1K | 0 | 0.966 | claude-opus-5 | 2/0/1 | 6.00/n/a/2.00 |  |
| 7 | Detect Scaffold Requirement | 0m08s | 1 | 1 | 1.0 | 1 | 3 | 110.7K | 110.7K | 0 | 0.949 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 8 | Generate Architect Plan | 1m32s | 2 | 3 | 1.5 | 2 | 5 | 114.7K | 118.1K | 0 | 0.968 | claude-opus-5 | 0/1/1 | n/a/1.00/2.00 |  |
| 9 | Generate Shared Risk Analysis | 1m30s | 5 | 5 | 1.0 | 1 | 292 | 122.6K | 127.3K | 0 | 0.985 | claude-opus-5 | 0/1/4 | n/a/1.00/1.00 |  |
| 10 | Commit and Push | 0m24s | 3 | 3 | 1.0 | 1 | 938 | 350.3K | 350.8K | 0 | 0.999 | claude-opus-5 | 0/0/3 | n/a/n/a/1.00 | ctx>threshold |
| 11 | Create Draft PR | 8m15s | 11 | 11 | 1.0 | 1 | 17.2K | 366.2K | 377.4K | 1 | 0.993 | claude-opus-5 | 1/1/7 | 1.00/1.00/1.00 | ctx>threshold |
| 12 | Update Status Plan Review | 7m19s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 1 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 15m40s | 25 | 37 | 1.48 | 6 | 18.4K |  | 377.4K |  | 0.99 | claude-opus-5 | 3/3/17 | 4.33/1.00/1.12 |  |

Wall is this run's last step end minus its first step start; steps sum to 21m09s.

14 turn(s) exceeded the 200,000-token context threshold.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | Update Status In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Phase A, Frontend Implementation | 1m19s | 14 | 17 | 1.21 | 2 | 109 | 105.4K | 108.6K | 0 | 0.995 | claude-sonnet-5 | 0/4/10 | n/a/1.25/1.20 |  |
| 11 | Phase D, E2E Test Generation | 1m41s | 15 | 15 | 1.0 | 1 | 231 | 107.2K | 109.9K | 0 | 0.996 | claude-sonnet-5 | 0/2/13 | n/a/1.00/1.00 |  |
| 12 | Phase E, Self-Review | 2m31s | 8 | 21 | 3.0 | 7 | 7.1K | 161.9K | 406.7K | 0 | 0.919 | claude-sonnet-5 | 5/0/1 | 3.60/n/a/1.00 | ctx>threshold |
| 13 | Phase F, Refactor Gate | 1m09s | 10 | 10 | 1.0 | 1 | 317 | 100.0K | 102.0K | 0 | 0.995 | claude-sonnet-5 | 0/1/9 | n/a/1.00/1.00 |  |
| 14 | Phase G, UAT Generation | 0m51s | 6 | 6 | 1.0 | 1 | 22 | 112.2K | 113.8K | 0 | 0.993 | claude-sonnet-5 | 0/2/4 | n/a/1.00/1.00 |  |
| 15 | Documentation Check | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 16 | Phase H, Artifact Re-check | 2m40s | 6 | 13 | 2.6 | 5 | 3.5K | 244.3K | 422.6K | 0 | 0.936 | claude-opus-5 | 2/0/2 | 5.00/n/a/1.00 | ctx>threshold, model!=marker |
| 17 | Push | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 18 | CI Watch | 3m40s | 11 | 11 | 1.0 | 1 | 14.9K | 436.1K | 450.5K | 0 | 0.994 | claude-opus-5 | 0/0/9 | n/a/n/a/1.00 | ctx>threshold |
| 19 | Handover | 0m03s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 21m14s | 70 | 93 | 1.37 | 7 | 26.2K |  | 450.5K |  | 0.98 | claude-sonnet-5 | 7/9/48 | 4.00/1.11/1.04 |  |

Wall is this run's last step end minus its first step start; steps sum to 13m55s.

16 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a1768cd851de58559 | build-feature | 12 | 6 | 18 | 3.6 | 5/0/0 | 3.60/n/a/n/a | 2.2K | 81.4K | 96.5K | 0.809 | claude-sonnet-5 |  |
| agent-a1a831fb33d4ad5aa | build-feature | 16 | 3 | 10 | 5.0 | 2/0/0 | 5.00/n/a/n/a | 19 | 68.9K | 87.2K | 0.578 | claude-sonnet-5 |  |
| agent-a2b54149d7887ab7d | build-feature | 11 (+6 outside) | 21 | 29 | 1.45 | 1/2/17 | 1.00/1.00/1.53 | 257 | 103.6K | 110.1K | 0.959 | claude-sonnet-5 |  |
| agent-a97d58fd1f2346516 | build-feature | 13 (+5 outside) | 15 | 22 | 1.57 | 1/1/12 | 5.00/1.00/1.33 | 334 | 95.8K | 102.2K | 0.943 | claude-sonnet-5 |  |
| agent-aacca91b6219c3fb1 | plan-feature | 6,7,8,9 (+3 outside) | 14 | 30 | 2.31 | 3/2/8 | 5.67/1.00/1.38 | 324 | 109.0K | 128.2K | 0.925 | claude-opus-5 |  |
| agent-abd9fe4406d17e756 | build-feature | 14 (+7 outside) | 13 | 23 | 1.92 | 1/2/9 | 1.00/1.00/2.22 | 190 | 105.2K | 114.2K | 0.931 | claude-sonnet-5 |  |
| agent-ac8c261a5bf5cdcd9 | build-feature | 8 (+6 outside) | 20 | 30 | 1.58 | 0/4/15 | n/a/1.25/1.67 | 1.2K | 100.3K | 109.0K | 0.946 | claude-sonnet-5 |  |

**7 dispatch(es):** median ctx max 109.0K, peak 128.2K, 0 above the 200,000-token threshold. Distribution: 87.2K, 96.5K, 102.2K, 109.0K, 110.1K, 114.2K, 128.2K.

**All runs:** 2 run(s), wall 36m54s (sum of per-run walls, idle time between runs excluded), 348 turns, 462 tool calls, 282.8K output tokens, cache hit 0.983.

Turn classes across every bucket, read / edit / exec: 24/32/229 turns, 2.62/1.03/1.24 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

253 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 14/20/164).
