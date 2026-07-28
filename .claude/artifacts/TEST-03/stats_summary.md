# Run statistics, TEST-03

Generated 2026-07-28 13:56 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m33s | 3 | 5 | 1.67 | 2 | 1.8K | 192.2K | 197.3K | 0 | 0.976 | claude-opus-5 | 1/0/2 | 2.00/n/a/1.50 |  |
| 1 | MCP Verification | 0m24s | 2 | 2 | 1.0 | 1 | 1.1K | 198.3K | 198.5K | 0 | 0.997 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 2 | Dependency Check | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Status and Plan Verification | 0m12s | 1 | 1 | 1.0 | 1 | 663 | 199.3K | 199.3K | 0 | 0.996 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 4 | Branch Setup | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Update Status In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read the Plan | 0m24s | 2 | 2 | 1.0 | 1 | 1.5K | 204.0K | 208.0K | 0 | 0.979 | claude-opus-5 | 1/0/1 | 1.00/n/a/1.00 | ctx>threshold |
| 8 | Phase A, Frontend Implementation | 4m41s | 14 | 27 | 1.93 | 5 | 970 | 108.4K | 118.8K | 0 | 0.978 | claude-opus-5 | 1/4/9 | 1.00/3.25/1.44 |  |
| 12 | Phase E, Self-Review | 6m11s | 14 | 49 | 3.77 | 10 | 2.4K | 100.0K | 233.6K | 0 | 0.92 | claude-opus-5 | 11/0/1 | 4.27/n/a/1.00 | ctx>threshold |
| 13 | Phase F, Refactor Gate | 5m49s | 25 | 50 | 2.0 | 9 | 1.7K | 100.5K | 113.8K | 0 | 0.976 | claude-opus-5 | 0/3/22 | n/a/2.33/1.95 |  |
| 14 | Phase G, UAT Generation | 1m36s | 7 | 10 | 1.43 | 4 | 3.0K | 105.9K | 110.2K | 0 | 0.965 | claude-opus-5 | 1/2/4 | 4.00/1.00/1.00 |  |
| 15 | Documentation Check | 0m46s | 5 | 5 | 1.0 | 1 | 2.8K | 246.6K | 247.9K | 0 | 0.996 | claude-opus-5 | 0/2/3 | n/a/1.00/1.00 | ctx>threshold |
| 16 | Phase H, Artifact Re-check | 7m41s | 22 | 52 | 2.48 | 8 | 5.9K | 110.5K | 255.5K | 1 | 0.908 | claude-opus-5 | 7/2/10 | 3.43/2.50/2.10 | ctx>threshold |
| 17 | Push | 0m34s | 3 | 4 | 1.33 | 2 | 1.5K | 270.8K | 271.7K | 0 | 0.996 | claude-opus-5 | 0/0/3 | n/a/n/a/1.33 | ctx>threshold |
| 18 | CI Watch | 3m36s | 13 | 13 | 1.0 | 1 | 13.9K | 285.0K | 294.3K | 0 | 0.994 | claude-opus-5 | 0/2/11 | n/a/1.00/1.00 | ctx>threshold |
| 19 | Handover | 0m12s | 1 | 1 | 1.0 | 1 | 387 | 298.8K | 298.8K | 0 | 0.985 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 20 | Summary | 0m08s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 55m35s | 112 | 221 | 2.01 | 10 | 37.5K |  | 298.8K |  | 0.968 | claude-opus-5 | 22/16/69 | 3.59/2.00/1.55 |  |

Wall is this run's last step end minus its first step start; steps sum to 32m47s.

29 turn(s) exceeded the 200,000-token context threshold.

## Run: unknown

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Phase B, Backend Implementation | 7m31s | 19 | 40 | 2.11 | 8 | 1.8K | 103.3K | 118.5K | 0 | 0.966 | claude-opus-5 | 1/5/13 | 8.00/3.40/1.15 |  |
| 10 | Phase C, Integration | 1m20s | 6 | 14 | 2.33 | 4 | 277 | 78.0K | 90.1K | 0 | 0.919 | claude-opus-5 | 0/0/6 | n/a/n/a/2.33 |  |
| 11 | Phase D, E2E Test Generation | 4m42s | 20 | 32 | 1.6 | 6 | 1.1K | 82.4K | 96.7K | 0 | 0.972 | claude-opus-5 | 0/3/17 | n/a/1.00/1.71 |  |
| **run total** |  | 15m54s | 45 | 86 | 1.91 | 8 | 3.2K |  | 118.5K |  | 0.963 | claude-opus-5 | 1/8/36 | 8.00/2.50/1.61 |  |

Wall is this run's last step end minus its first step start; steps sum to 13m33s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a17299c23234e51f4 | unknown | 9 (+3 outside) | 22 | 48 | 2.29 | 1/5/15 | 8.00/3.40/1.53 | 3.6K | 99.2K | 118.8K | 0.952 | claude-opus-5 |  |
| agent-a56c6cca0b3717dfc | unknown | 10 (+3 outside) | 9 | 18 | 2.25 | 0/0/8 | n/a/n/a/2.25 | 2.0K | 73.3K | 90.3K | 0.885 | claude-opus-5 |  |
| agent-a862f44c5d9024767 | build-feature | 14 (+3 outside) | 10 | 22 | 2.44 | 2/2/5 | 4.50/1.00/2.20 | 4.2K | 98.6K | 110.5K | 0.903 | claude-opus-5 |  |
| agent-a889d98e06e155e24 | build-feature | 16 (+1 outside) | 12 | 25 | 2.27 | 0/2/9 | n/a/2.50/2.22 | 1.0K | 94.4K | 105.3K | 0.907 | claude-opus-5 |  |
| agent-a8dbef443cbf150f2 | unknown | 11 (+3 outside) | 23 | 35 | 1.59 | 0/3/19 | n/a/1.00/1.68 | 2.4K | 80.3K | 97.3K | 0.954 | claude-opus-5 |  |
| agent-aa22dd7758d671a5a | build-feature | 13 (+4 outside) | 29 | 62 | 2.21 | 0/3/25 | n/a/2.33/2.20 | 3.4K | 96.2K | 114.2K | 0.957 | claude-opus-5 |  |
| agent-ab1095f33f0ce33df | build-feature | 12 | 12 | 47 | 4.27 | 11/0/0 | 4.27/n/a/n/a | 43 | 78.3K | 103.7K | 0.89 | claude-opus-5 |  |
| agent-ac1fce1999fc87827 | build-feature | 8 (+3 outside) | 17 | 36 | 2.25 | 2/4/10 | 3.00/3.25/1.70 | 2.7K | 104.2K | 119.0K | 0.932 | claude-opus-5 |  |
| agent-ae3129e86a8240d39 | build-feature | 16 | 8 | 24 | 3.43 | 7/0/0 | 3.43/n/a/n/a | 33 | 80.5K | 111.8K | 0.826 | claude-opus-5 |  |

**9 dispatch(es):** median ctx max 110.5K, peak 119.0K, 0 above the 200,000-token threshold. Distribution: 90.3K, 97.3K, 103.7K, 105.3K, 110.5K, 111.8K, 114.2K, 118.8K, 119.0K.

**All runs:** 2 run(s), wall 1h11m (sum of per-run walls, idle time between runs excluded), 229 turns, 425 tool calls, 89.7K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 28/24/154 turns, 3.61/2.17/1.65 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

72 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 5/0/49).
