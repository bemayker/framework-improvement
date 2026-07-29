# Run statistics, TEST-03

Generated 2026-07-28 15:32 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m22s | 2 | 3 | 1.5 | 2 | 1.3K | 136.6K | 138.8K | 0 | 0.975 | claude-opus-5 | 0/0/2 | n/a/n/a/1.50 |  |
| 1 | MCP Verification | 0m13s | 1 | 1 | 1.0 | 1 | 537 | 139.4K | 139.4K | 0 | 0.996 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 2 | Dependency Check | 0m09s | 1 | 1 | 1.0 | 1 | 310 | 140.2K | 140.2K | 0 | 0.994 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 3 | Fetch Feature Details | 0m06s | 1 | 1 | 1.0 | 1 | 279 | 140.9K | 140.9K | 0 | 0.996 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 4 | Update Status Planning | 0m07s | 1 | 1 | 1.0 | 1 | 334 | 141.1K | 141.1K | 0 | 0.998 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 5 | Create Branch | 0m49s | 3 | 7 | 2.33 | 5 | 2.5K | 111.4K | 144.1K | 0 | 0.846 | claude-opus-5 | 1/0/1 | 1.00/n/a/5.00 |  |
| 6 |  | 2m59s | 7 | 19 | 2.71 | 7 | 129 | 75.5K | 82.9K | 0 | 0.935 | claude-fable-5 | 1/0/6 | 7.00/n/a/2.00 |  |
| 7 | Detect Scaffold Requirement | 0m08s | 1 | 1 | 1.0 | 1 | 305 | 86.3K | 86.3K | 0 | 0.96 | claude-fable-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 8 | Generate Architect Plan | 1m12s | 2 | 2 | 1.0 | 1 | 5.7K | 89.5K | 92.4K | 0 | 0.966 | claude-fable-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 9 | Generate Shared Risk Analysis | 0m24s | 2 | 2 | 1.0 | 1 | 1.4K | 93.3K | 94.0K | 0 | 0.991 | claude-fable-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 10 | Commit and Push | 0m30s | 3 | 3 | 1.0 | 1 | 1.5K | 154.0K | 157.0K | 0 | 0.982 | claude-opus-5 | 1/0/2 | 1.00/n/a/1.00 |  |
| 11 | Create Draft PR | 0m36s | 3 | 3 | 1.0 | 1 | 2.0K | 158.0K | 159.1K | 0 | 0.996 | claude-opus-5 | 0/0/3 | n/a/n/a/1.00 |  |
| 12 | Update Status Plan Review | 0m08s | 1 | 1 | 1.0 | 1 | 404 | 159.4K | 159.4K | 0 | 0.998 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 13 | Summary | 0m01s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 8m22s | 28 | 45 | 1.61 | 7 | 16.7K |  | 159.4K |  | 0.964 | claude-opus-5 | 3/2/22 | 3.00/1.00/1.50 |  |

Wall is this run's last step end minus its first step start; steps sum to 7m44s.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m32s | 2 | 3 | 1.5 | 2 | 2.0K | 197.0K | 200.0K | 0 | 0.973 | claude-opus-5 | 1/0/1 | 2.00/n/a/1.00 | ctx>threshold |
| 1 | MCP Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 2 | Dependency Check | 0m10s | 1 | 1 | 1.0 | 1 | 445 | 201.5K | 201.5K | 0 | 0.993 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 3 | Status and Plan Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 4 | Branch Setup | 0m10s | 1 | 1 | 1.0 | 1 | 481 | 202.1K | 202.1K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Update Status In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read the Plan | 0m15s | 1 | 1 | 1.0 | 1 | 973 | 202.6K | 202.6K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 8 | Phase A, Frontend Implementation | 3m11s | 10 | 21 | 2.1 | 7 | 215 | 98.8K | 108.2K | 0 | 0.94 | claude-opus-5 | 0/2/8 | n/a/3.00/1.88 |  |
| 9 | Phase B, Backend Implementation | 5m55s | 15 | 42 | 2.8 | 10 | 358 | 110.4K | 129.8K | 0 | 0.951 | claude-opus-5 | 2/3/10 | 7.50/5.00/1.20 |  |
| 10 | Phase C, Integration | 3m17s | 11 | 32 | 2.91 | 12 | 499 | 104.7K | 120.0K | 0 | 0.939 | claude-opus-5 | 1/1/9 | 4.00/1.00/3.00 |  |
| 11 | Phase D, E2E Test Generation | 2m45s | 15 | 26 | 1.73 | 5 | 1.2K | 95.6K | 104.2K | 0 | 0.962 | claude-opus-5 | 1/1/13 | 4.00/1.00/1.62 |  |
| 12 | Phase E, Self-Review | 5m42s | 13 | 44 | 3.67 | 12 | 1.8K | 102.6K | 231.4K | 0 | 0.919 | claude-opus-5 | 10/0/1 | 4.20/n/a/1.00 | ctx>threshold |
| 13 | Phase F, Refactor Gate | 5m46s | 17 | 47 | 2.76 | 16 | 1.6K | 125.6K | 144.7K | 0 | 0.956 | claude-opus-5 | 1/8/8 | 6.00/1.00/4.12 |  |
| 14 | Phase G, UAT Generation | 2m09s | 9 | 16 | 1.78 | 5 | 91 | 95.9K | 103.9K | 0 | 0.937 | claude-opus-5 | 1/3/5 | 5.00/1.00/1.60 |  |
| 15 | Documentation Check | 0m34s | 4 | 6 | 1.5 | 2 | 2.5K | 244.3K | 246.0K | 0 | 0.994 | claude-opus-5 | 2/1/1 | 1.50/2.00/1.00 | ctx>threshold |
| 16 | Phase H, Artifact Re-check | 5m27s | 10 | 30 | 3.33 | 6 | 2.4K | 106.2K | 252.0K | 0 | 0.902 | claude-opus-5 | 7/0/1 | 4.00/n/a/1.00 | ctx>threshold |
| 17 | Push | 0m22s | 3 | 3 | 1.0 | 1 | 948 | 253.7K | 253.9K | 0 | 0.997 | claude-opus-5 | 0/0/3 | n/a/n/a/1.00 | ctx>threshold |
| 18 | CI Watch | 2m50s | 3 | 3 | 1.0 | 1 | 3.3K | 256.9K | 258.2K | 0 | 0.995 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 | ctx>threshold |
| 19 | Handover | 0m12s | 1 | 1 | 1.0 | 1 | 330 | 261.2K | 261.2K | 0 | 0.988 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 20 | Summary | 0m09s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 47m39s | 116 | 277 | 2.43 | 16 | 19.2K |  | 261.2K |  | 0.954 | claude-opus-5 | 26/19/66 | 4.19/1.89/1.95 |  |

Wall is this run's last step end minus its first step start; steps sum to 39m26s.

19 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a27344e8bd83867b2 | build-feature | 16 | 8 | 28 | 4.0 | 7/0/0 | 4.00/n/a/n/a | 26 | 70.4K | 98.2K | 0.826 | claude-opus-5 |  |
| agent-a4284bd9ab3aa07db | build-feature | 8 (+2 outside) | 12 | 27 | 2.45 | 0/2/9 | n/a/3.00/2.33 | 1.4K | 95.5K | 108.4K | 0.905 | claude-opus-5 |  |
| agent-a499541adb9b38485 | build-feature | 12 | 11 | 42 | 4.2 | 10/0/0 | 4.20/n/a/n/a | 38 | 79.7K | 100.7K | 0.885 | claude-opus-5 |  |
| agent-a89c828d0e869584d | build-feature | 13 (+2 outside) | 19 | 48 | 2.67 | 1/8/9 | 6.00/1.00/3.78 | 3.2K | 122.7K | 144.9K | 0.938 | claude-opus-5 |  |
| agent-a970f083b93452ea6 | plan-feature | 5,6,7,8,9 (+1 outside) | 14 | 29 | 2.23 | 1/2/10 | 7.00/1.00/2.00 | 8.6K | 80.2K | 94.1K | 0.916 | claude-fable-5 |  |
| agent-ab0d133c124348747 | build-feature | 9 (+2 outside) | 17 | 43 | 2.69 | 2/3/11 | 7.50/5.00/1.18 | 2.1K | 108.0K | 130.0K | 0.937 | claude-opus-5 |  |
| agent-accff9128492cde31 | build-feature | 14 (+2 outside) | 11 | 20 | 2.0 | 1/3/6 | 5.00/1.00/2.00 | 1.2K | 92.5K | 104.3K | 0.912 | claude-opus-5 |  |
| agent-adbdee1e0e127b81a | build-feature | 10 (+2 outside) | 13 | 33 | 2.75 | 1/1/10 | 4.00/1.00/2.80 | 2.1K | 101.6K | 120.3K | 0.92 | claude-opus-5 |  |
| agent-ae99bcfa82a993170 | build-feature | 11 (+5 outside) | 20 | 30 | 1.58 | 2/2/15 | 2.50/1.00/1.53 | 2.7K | 95.6K | 108.9K | 0.951 | claude-opus-5 |  |

**9 dispatch(es):** median ctx max 108.4K, peak 144.9K, 0 above the 200,000-token threshold. Distribution: 94.1K, 98.2K, 100.7K, 104.3K, 108.4K, 108.9K, 120.3K, 130.0K, 144.9K.

**All runs:** 2 run(s), wall 56m01s (sum of per-run walls, idle time between runs excluded), 207 turns, 399 tool calls, 79.7K output tokens, cache hit 0.954.

Turn classes across every bucket, read / edit / exec: 34/22/126 turns, 3.65/1.77/1.70 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

63 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 5/1/38).
