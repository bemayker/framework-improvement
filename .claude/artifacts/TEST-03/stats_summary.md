# Run statistics, TEST-03

Generated 2026-07-31 09:55 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | Update Status to Planning | 0m36s | 1 | 1 | 1.0 | 1 | 896 | 230.5K | 230.5K | 0 | 0.993 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Create Branch | 1m00s | 4 | 4 | 1.0 | 1 | 2.1K | 237.4K | 240.4K | 0 | 0.99 | claude-opus-5 | 0/0/3 | n/a/n/a/1.00 | ctx>threshold |
| 6-9 | Planner dispatch, Sections 6 to 9 | 5m53s | 10 | 27 | 3.0 | 9 | 5.3K | 126.1K | 244.7K | 0 | 0.905 | claude-fable-5 | 2/2/4 | 7.50/1.00/2.25 | ctx>threshold |
| 10 | Commit and Push | 0m42s | 4 | 4 | 1.0 | 1 | 2.6K | 249.0K | 250.7K | 0 | 0.994 | claude-opus-5 | 1/0/3 | 1.00/n/a/1.00 | ctx>threshold |
| 11 | Create Draft PR | 0m30s | 3 | 3 | 1.0 | 1 | 1.4K | 252.6K | 253.0K | 0 | 0.997 | claude-opus-5 | 0/0/3 | n/a/n/a/1.00 | ctx>threshold |
| 12 | Update Status to Plan Review | 0m15s | 1 | 1 | 1.0 | 1 | 789 | 253.6K | 253.6K | 0 | 0.998 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 13 | Summary | 0m02s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 8m58s | 23 | 40 | 1.82 | 9 | 13.1K |  | 253.6K |  | 0.969 | claude-opus-5 | 3/2/15 | 5.33/1.00/1.33 |  |

Wall is this run's last step end minus its first step start; steps sum to 8m58s.

15 turn(s) exceeded the 200,000-token context threshold.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m10s | 1 | 1 | 1.0 | 1 | 613 | 307.9K | 307.9K | 0 | 0.994 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 1 | MCP Verification | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 2 | Dependency Check | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Status and Plan Verification | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 4 | Branch Setup | 0m11s | 1 | 1 | 1.0 | 1 | 815 | 309.0K | 309.0K | 0 | 0.996 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Update Status to In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read the Plan | 0m17s | 1 | 1 | 1.0 | 1 | 1.1K | 309.8K | 309.8K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 8 | Phase A, Frontend Implementation | 4m08s | 11 | 23 | 2.3 | 6 | 3.2K | 146.1K | 314.8K | 0 | 0.921 | claude-opus-5 | 1/3/5 | 6.00/2.67/1.60 | ctx>threshold |
| 9 | Phase B, Backend Implementation | 7m47s | 18 | 43 | 2.53 | 10 | 9.0K | 176.4K | 331.1K | 0 | 0.957 | claude-opus-5 | 2/3/11 | 7.00/4.33/1.36 | ctx>threshold |
| 11 | Phase D, E2E Test Generation | 5m19s | 21 | 36 | 1.8 | 6 | 5.1K | 136.4K | 336.5K | 0 | 0.96 | claude-opus-5 | 2/3/14 | 6.00/1.00/1.43 | ctx>threshold |
| 12 | Phase E, Self-Review | 8m51s | 26 | 71 | 2.96 | 10 | 8.4K | 125.8K | 352.1K | 0 | 0.934 | claude-opus-5 | 9/2/11 | 5.44/1.00/1.64 | ctx>threshold |
| 13 | Phase F, Refactor Gate | 5m24s | 19 | 41 | 2.28 | 10 | 4.6K | 126.7K | 358.4K | 0 | 0.957 | claude-opus-5 | 2/6/9 | 8.00/1.00/2.00 | ctx>threshold |
| 14 | Phase G, UAT Generation | 2m57s | 10 | 22 | 2.44 | 9 | 4.2K | 161.3K | 363.5K | 0 | 0.931 | claude-opus-5 | 1/2/5 | 9.00/1.00/2.00 | ctx>threshold |
| 15 | Documentation Check | 0m47s | 5 | 5 | 1.0 | 1 | 2.9K | 366.4K | 367.4K | 0 | 0.998 | claude-opus-5 | 0/2/3 | n/a/1.00/1.00 | ctx>threshold |
| 16 | Phase H, Artifact Re-check | 7m06s | 16 | 45 | 3.21 | 8 | 5.6K | 135.7K | 377.5K | 0 | 0.901 | claude-opus-5 | 7/1/4 | 4.86/1.00/2.00 | ctx>threshold |
| 17 | Push | n/a | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 43m00s | 129 | 289 | 2.41 | 10 | 45.4K |  | 377.5K |  | 0.948 | claude-opus-5 | 24/22/65 | 5.83/1.68/1.58 |  |

Wall is this run's last step end minus its first step start; steps sum to 43m00s.

28 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a06020d7044953cb8 | build-feature | 12 | 14 | 26 | 2.0 | 2/2/9 | 4.00/1.00/1.78 | 723 | 86.4K | 96.9K | 0.92 | claude-opus-5 |  |
| agent-a189e9a11710df103 | build-feature | 12 | 8 | 41 | 5.86 | 7/0/0 | 5.86/n/a/n/a | 20 | 84.6K | 104.8K | 0.845 | claude-opus-5 |  |
| agent-a1c132df5235bc8d9 | build-feature | 16 | 6 | 28 | 5.6 | 5/0/0 | 5.60/n/a/n/a | 18 | 90.5K | 128.1K | 0.764 | claude-opus-5 |  |
| agent-a3b06f3e3c4d8e8e6 | build-feature | 11 | 19 | 34 | 1.89 | 2/3/13 | 6.00/1.00/1.46 | 1.3K | 115.6K | 129.7K | 0.95 | claude-opus-5 |  |
| agent-a4ea34a7b9548f95e | build-feature | 16 | 7 | 14 | 2.33 | 2/1/3 | 3.00/1.00/2.33 | 20 | 72.3K | 77.7K | 0.846 | claude-opus-5 |  |
| agent-aa8fbc05394b16cab | plan-feature | 6-9 | 8 | 25 | 3.57 | 2/2/3 | 7.50/1.00/2.67 | 1.7K | 96.9K | 115.0K | 0.852 | claude-fable-5 |  |
| agent-ae9197adb29042a6d | build-feature | 14 | 8 | 20 | 2.86 | 1/2/4 | 9.00/1.00/2.25 | 1.4K | 111.1K | 125.0K | 0.881 | claude-opus-5 |  |
| agent-ae97ec68eb55d911e | build-feature | 13 | 17 | 39 | 2.44 | 2/6/8 | 8.00/1.00/2.12 | 876 | 99.7K | 115.0K | 0.942 | claude-opus-5 |  |
| agent-af3d360809adfed92 | build-feature | 9 | 13 | 38 | 3.17 | 2/3/7 | 7.00/4.33/1.57 | 43 | 119.3K | 138.0K | 0.923 | claude-opus-5 |  |
| agent-afc3ad646029845ea | build-feature | 8 | 9 | 21 | 2.62 | 1/3/4 | 6.00/2.67/1.75 | 32 | 108.9K | 121.8K | 0.876 | claude-opus-5 |  |

**10 dispatch(es):** median ctx max 118.4K, peak 138.0K, 0 above the 200,000-token threshold. Distribution: 77.7K, 96.9K, 104.8K, 115.0K, 115.0K, 121.8K, 125.0K, 128.1K, 129.7K, 138.0K.

**All runs:** 2 run(s), wall 51m58s (sum of per-run walls, idle time between runs excluded), 199 turns, 397 tool calls, 95.0K output tokens, cache hit 0.956.

Turn classes across every bucket, read / edit / exec: 34/24/116 turns, 4.82/1.62/1.54 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

47 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 7/0/36).
