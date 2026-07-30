# Run statistics, TEST-03

Generated 2026-07-30 12:37 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** the summary this collection replaced was generated 1h15m BEFORE this item's newest step marker, so it predated its own data: a collection was skipped or killed (an end-of-session hook can be killed outright on cloud surfaces), and any figure read from that file in the meantime was a stale one rather than the run it appeared to describe.

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m35s | 2 | 4 | 2.0 | 2 | 1.7K | 214.8K | 216.1K | 0 | 0.991 | claude-opus-5 | 0/0/2 | n/a/n/a/2.00 | ctx>threshold |
| 1 | MCP Verification | 0m36s | 1 | 1 | 1.0 | 1 | 1.7K | 221.7K | 221.7K | 0 | 0.975 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 2 | Dependency Check | 0m07s | 1 | 1 | 1.0 | 1 | 296 | 223.8K | 223.8K | 0 | 0.991 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 3 | Fetch Feature Details | 0m08s | 1 | 1 | 1.0 | 1 | 329 | 224.1K | 224.1K | 0 | 0.999 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 4 | Update Status to Planning | 0m07s | 1 | 1 | 1.0 | 1 | 367 | 224.5K | 224.5K | 0 | 0.998 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Create Branch | 0m35s | 2 | 2 | 1.0 | 1 | 1.3K | 225.5K | 226.1K | 0 | 0.996 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 | ctx>threshold |
| 6-9 | Planner dispatch, Sections 6 to 9 | 4m46s | 11 | 26 | 2.6 | 8 | 3.2K | 114.5K | 229.0K | 0 | 0.914 | claude-fable-5 | 0/2/7 | n/a/1.00/3.29 | ctx>threshold |
| 10 | Commit and Push | 0m17s | 2 | 2 | 1.0 | 1 | 796 | 230.4K | 230.7K | 0 | 0.996 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 | ctx>threshold |
| 11 | Create Draft PR | 0m30s | 2 | 2 | 1.0 | 1 | 1.6K | 233.7K | 234.4K | 0 | 0.992 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 | ctx>threshold |
| 12 | Update Status to Plan Review | 0m11s | 1 | 1 | 1.0 | 1 | 551 | 234.8K | 234.8K | 0 | 0.998 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 13 | Summary | 0m08s | 1 | 1 | 1.0 | 1 | 416 | 235.5K | 235.5K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| **run total** |  | 8m00s | 25 | 42 | 1.75 | 8 | 12.3K |  | 235.5K |  | 0.971 | claude-opus-5 | 0/2/21 | n/a/1.00/1.86 |  |

Wall is this run's last step end minus its first step start; steps sum to 8m00s.

16 turn(s) exceeded the 200,000-token context threshold.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m32s | 2 | 2 | 1.0 | 1 | 1.7K | 280.0K | 280.7K | 0 | 0.994 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 | ctx>threshold |
| 1 | MCP Verification | 0m08s | 1 | 1 | 1.0 | 1 | 315 | 281.6K | 281.6K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 2 | Dependency Check | 0m07s | 1 | 1 | 1.0 | 1 | 296 | 282.3K | 282.3K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 3 | Status and Plan Verification | 0m08s | 1 | 1 | 1.0 | 1 | 293 | 282.7K | 282.7K | 0 | 0.999 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 4 | Branch Setup | 0m08s | 1 | 1 | 1.0 | 1 | 310 | 283.1K | 283.1K | 0 | 0.999 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Update Status to In Progress | 0m14s | 1 | 1 | 1.0 | 1 | 424 | 283.4K | 283.4K | 0 | 0.999 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 6 | Read the Plan | 0m22s | 1 | 1 | 1.0 | 1 | 1.6K | 284.2K | 284.2K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 8 | Phase A, Frontend Implementation | 4m16s | 12 | 29 | 2.64 | 7 | 4.1K | 118.1K | 289.4K | 0 | 0.929 | claude-opus-5 | 2/3/5 | 5.50/2.67/1.80 | ctx>threshold |
| 9 | Phase B, Backend Implementation | 8m42s | 18 | 44 | 2.59 | 7 | 3.2K | 115.8K | 295.4K | 0 | 0.95 | claude-opus-5 | 3/3/10 | 4.33/4.33/1.70 | ctx>threshold |
| 10 | Phase C, Integration | 4m56s | 9 | 27 | 3.38 | 10 | 2.6K | 131.5K | 300.7K | 0 | 0.931 | claude-opus-5 | 2/0/5 | 8.00/n/a/2.00 | ctx>threshold |
| 11 | Phase D, E2E Test Generation | 7m24s | 24 | 43 | 1.87 | 7 | 4.4K | 114.0K | 305.0K | 0 | 0.965 | claude-opus-5 | 1/2/19 | 7.00/2.00/1.63 | ctx>threshold |
| 12 | Phase E, Self-Review | 13m51s | 25 | 71 | 3.09 | 12 | 7.0K | 121.9K | 320.1K | 1 | 0.908 | claude-opus-5 | 10/1/10 | 5.60/1.00/1.20 | ctx>threshold |
| 13 | Phase F, Refactor Gate | 9m55s | 19 | 50 | 2.78 | 8 | 3.1K | 133.7K | 326.0K | 0 | 0.951 | claude-opus-5 | 5/4/8 | 4.80/2.00/2.12 | ctx>threshold |
| 14 | Phase G, UAT Generation | 4m17s | 15 | 27 | 1.93 | 6 | 3.7K | 122.8K | 330.8K | 0 | 0.952 | claude-opus-5 | 2/2/9 | 3.50/1.00/1.89 | ctx>threshold |
| 15 | Documentation Check | 0m43s | 4 | 4 | 1.0 | 1 | 2.3K | 334.3K | 335.1K | 0 | 0.997 | claude-opus-5 | 1/1/2 | 1.00/1.00/1.00 | ctx>threshold |
| 16 | Phase H, Artifact Re-check | 5m32s | 8 | 20 | 2.86 | 6 | 3.5K | 145.5K | 341.9K | 0 | 0.898 | claude-opus-5 | 5/0/1 | 3.60/n/a/1.00 | ctx>threshold |
| 17 | Push | 9m44s | 13 | 13 | 1.0 | 1 | 7.9K | 350.5K | 356.2K | 0 | 0.997 | claude-opus-5 | 0/0/12 | n/a/n/a/1.00 | ctx>threshold |
| 18 | CI Watch | 3m13s | 3 | 3 | 1.0 | 1 | 4.2K | 357.2K | 357.8K | 0 | 0.999 | claude-opus-5 | 0/0/3 | n/a/n/a/1.00 | ctx>threshold |
| 19 | Handover | 0m18s | 1 | 1 | 1.0 | 1 | 558 | 361.6K | 361.6K | 0 | 0.989 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 1h14m | 159 | 340 | 2.27 | 12 | 51.5K |  | 361.6K |  | 0.96 | claude-opus-5 | 31/16/93 | 4.94/2.31/1.51 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h14m.

47 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a1efe411b0e7f9d9d | build-feature | 16 | 6 | 18 | 3.6 | 5/0/0 | 3.60/n/a/n/a | 28 | 80.9K | 111.9K | 0.77 | claude-opus-5 |  |
| agent-a4a4c01dc60aa58bc | build-feature | 8 | 10 | 27 | 3.0 | 2/3/4 | 5.50/2.67/2.00 | 1.3K | 84.1K | 95.2K | 0.887 | claude-opus-5 |  |
| agent-a4c84341e37ba1904 | build-feature | 13 | 17 | 48 | 3.0 | 5/4/7 | 4.80/2.00/2.29 | 48 | 111.3K | 136.7K | 0.938 | claude-opus-5 |  |
| agent-a64872faae04f551e | build-feature | 11 | 22 | 41 | 1.95 | 1/2/18 | 7.00/2.00/1.67 | 1.2K | 96.8K | 111.3K | 0.957 | claude-opus-5 |  |
| agent-a7329ff8f8596918b | plan-feature | 6-9 | 9 | 24 | 3.0 | 0/2/6 | n/a/1.00/3.67 | 1.2K | 89.3K | 105.7K | 0.868 | claude-fable-5 |  |
| agent-a7d3f236c31ece82e | build-feature | 14 | 13 | 25 | 2.08 | 2/2/8 | 3.50/1.00/2.00 | 1.4K | 91.1K | 102.8K | 0.929 | claude-opus-5 |  |
| agent-a8f43f98eee5ecefe | build-feature | 12 | 12 | 23 | 2.09 | 2/1/8 | 6.00/1.00/1.25 | 35 | 90.4K | 107.4K | 0.901 | claude-opus-5 |  |
| agent-a9b9ba6dd80383476 | build-feature | 10 | 7 | 25 | 4.17 | 2/0/4 | 8.00/n/a/2.25 | 22 | 83.6K | 94.9K | 0.87 | claude-opus-5 |  |
| agent-aa6bbad34593a122e | build-feature | 9 | 16 | 42 | 2.8 | 3/3/9 | 4.33/4.33/1.78 | 64 | 93.6K | 116.9K | 0.934 | claude-opus-5 |  |
| agent-ad879bf51ae2ed347 | build-feature | 12 | 9 | 44 | 5.5 | 8/0/0 | 5.50/n/a/n/a | 27 | 78.2K | 100.6K | 0.777 | claude-opus-5 |  |

**10 dispatch(es):** median ctx max 106.5K, peak 136.7K, 0 above the 200,000-token threshold. Distribution: 94.9K, 95.2K, 100.6K, 102.8K, 105.7K, 107.4K, 111.3K, 111.9K, 116.9K, 136.7K.

**All runs:** 2 run(s), wall 1h22m (sum of per-run walls, idle time between runs excluded), 229 turns, 439 tool calls, 88.9K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 38/18/146 turns, 4.21/2.17/1.49 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

45 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 7/0/32).
