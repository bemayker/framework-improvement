# Run statistics, TEST-03

Generated 2026-07-28 08:32 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m26s | 1 | 1 | 1.0 | 1 | 905 | 162.8K | 162.8K | 0 | 0.97 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 1 | MCP Verification | 0m17s | 1 | 1 | 1.0 | 1 | 761 | 164.7K | 164.7K | 0 | 0.989 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 2 | Dependency Check | 0m27s | 1 | 1 | 1.0 | 1 | 495 | 165.6K | 165.6K | 0 | 0.995 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 3 | Fetch Feature Details | 0m16s | 1 | 1 | 1.0 | 1 | 290 | 166.4K | 166.4K | 0 | 0.995 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 4 | Update Status Planning | 0m29s | 2 | 2 | 1.0 | 1 | 563 | 167.1K | 167.2K | 0 | 0.998 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 5 | Create Branch | 0m31s | 2 | 2 | 1.0 | 1 | 646 | 167.9K | 168.1K | 0 | 0.997 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 6 | Read References | 1m48s | 3 | 10 | 3.33 | 6 | 9 | 79.7K | 88.6K | 0 | 0.908 | claude-opus-5 | 0/0/3 | n/a/n/a/3.33 |  |
| 7 | Detect Scaffold Requirement | 0m08s | 1 | 1 | 1.0 | 1 | 3 | 94.4K | 94.4K | 0 | 0.939 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 8 | Generate Architect Plan | 1m41s | 2 | 2 | 1.0 | 1 | 299 | 98.6K | 102.5K | 0 | 0.959 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 9 | Generate Shared Risk Analysis | 0m31s | 2 | 2 | 1.0 | 1 | 2.2K | 103.8K | 104.8K | 0 | 0.989 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 10 | Commit and Push | 0m37s | 4 | 4 | 1.0 | 1 | 2.0K | 174.6K | 175.8K | 0 | 0.994 | claude-opus-5 | 0/0/4 | n/a/n/a/1.00 |  |
| 11 | Create Draft PR | 0m44s | 4 | 4 | 1.0 | 1 | 2.7K | 179.4K | 181.6K | 0 | 0.992 | claude-opus-5 | 0/0/4 | n/a/n/a/1.00 |  |
| 12 | Update Status Plan Review | 0m36s | 2 | 2 | 1.0 | 1 | 513 | 182.2K | 182.3K | 0 | 0.998 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 13 | Summary | 0m23s | 2 | 2 | 1.0 | 1 | 1.2K | 184.1K | 185.5K | 0 | 0.991 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 |  |
| **run total** |  | 10m16s | 28 | 35 | 1.25 | 6 | 12.7K |  | 185.5K |  | 0.985 | claude-opus-5 | 0/5/23 | n/a/1.00/1.30 |  |

Wall is this run's last step end minus its first step start; steps sum to 8m54s.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m26s | 1 | 2 | 2.0 | 2 | 1.3K | 224.4K | 224.4K | 0 | 0.974 | claude-opus-5 | 0/0/1 | n/a/n/a/2.00 | ctx>threshold |
| 1 | MCP Verification | 0m14s | 1 | 1 | 1.0 | 1 | 948 | 227.8K | 227.8K | 0 | 0.985 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 2 | Dependency Check | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Status and Plan Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 4 | Branch Setup | 0m24s | 2 | 2 | 1.0 | 1 | 801 | 229.3K | 229.5K | 0 | 0.996 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 | ctx>threshold |
| 5 | Update Status In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read the Plan | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Phase A, Frontend Implementation | 3m42s | 28 | 40 | 1.43 | 7 | 2.8K | 110.7K | 123.1K | 0 | 0.96 | claude-sonnet-5 | 1/13/14 | 1.00/1.00/1.86 |  |
| 9 | Phase B, Backend Implementation | 8m07s | 33 | 55 | 1.67 | 9 | 851 | 139.6K | 156.7K | 0 | 0.987 | claude-sonnet-5 | 0/6/27 | n/a/3.17/1.33 |  |
| 10 | Phase C, Integration | 0m37s | 4 | 6 | 1.5 | 3 | 14 | 87.6K | 89.3K | 0 | 0.963 | claude-sonnet-5 | 1/0/3 | 1.00/n/a/1.67 |  |
| 11 | Phase D, E2E Test Generation | 3m31s | 20 | 25 | 1.25 | 3 | 85 | 111.5K | 119.7K | 0 | 0.99 | claude-sonnet-5 | 3/2/15 | 2.00/1.00/1.13 |  |
| 12 | Phase E, Self-Review | 10m07s | 29 | 66 | 2.44 | 14 | 9.1K | 111.5K | 264.1K | 0 | 0.942 | claude-sonnet-5 | 13/1/11 | 3.77/1.00/1.27 | ctx>threshold |
| 13 | Phase F, Refactor Gate | 1m49s | 13 | 29 | 2.23 | 7 | 46 | 87.3K | 95.3K | 0 | 0.977 | claude-sonnet-5 | 2/2/9 | 4.50/2.50/1.67 |  |
| 14 | Phase G, UAT Generation | 0m38s | 6 | 6 | 1.0 | 1 | 293 | 77.8K | 79.1K | 0 | 0.992 | claude-sonnet-5 | 0/2/4 | n/a/1.00/1.00 |  |
| 15 | Documentation Check | 0m21s | 3 | 3 | 1.0 | 1 | 979 | 275.4K | 275.8K | 0 | 0.996 | claude-opus-5 | 1/1/1 | 1.00/1.00/1.00 | ctx>threshold |
| 16 | Phase H, Artifact Re-check | 3m20s | 13 | 24 | 2.0 | 5 | 2.3K | 113.1K | 281.3K | 0 | 0.927 | claude-sonnet-5 | 10/0/1 | 2.20/n/a/1.00 | ctx>threshold |
| 17 | Push | 0m47s | 4 | 5 | 1.25 | 2 | 2.4K | 283.3K | 284.7K | 0 | 0.997 | claude-opus-5 | 0/0/4 | n/a/n/a/1.25 | ctx>threshold |
| 18 | CI Watch | 3m06s | 12 | 12 | 1.0 | 1 | 11.5K | 297.2K | 304.9K | 0 | 0.994 | claude-opus-5 | 0/0/12 | n/a/n/a/1.00 | ctx>threshold |
| 19 | Handover | 0m25s | 1 | 1 | 1.0 | 1 | 166 | 308.3K | 308.3K | 0 | 0.989 | claude-opus-5 | 0/1/0 | n/a/1.00/n/a | ctx>threshold |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 45m30s | 170 | 277 | 1.66 | 14 | 33.5K |  | 308.3K |  | 0.975 | claude-sonnet-5 | 31/29/104 | 2.87/1.55/1.35 |  |

Wall is this run's last step end minus its first step start; steps sum to 37m34s.

32 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a3b15b010de0c4127 | build-feature | 13 (+5 outside) | 18 | 41 | 2.41 | 3/2/12 | 4.67/2.50/1.83 | 187 | 84.4K | 95.6K | 0.95 | claude-sonnet-5 |  |
| agent-a4b28d721d46e9709 | build-feature | 16 | 11 | 22 | 2.2 | 10/0/0 | 2.20/n/a/n/a | 39 | 82.8K | 103.3K | 0.886 | claude-sonnet-5 |  |
| agent-a699db1f8d38ea26a | build-feature | 8 (+4 outside) | 32 | 43 | 1.39 | 1/13/17 | 1.00/1.00/1.71 | 4.3K | 112.3K | 124.1K | 0.965 | claude-sonnet-5 |  |
| agent-a7e39e30d7cbb542a | build-feature | 12 | 12 | 45 | 4.09 | 11/0/0 | 4.09/n/a/n/a | 48 | 79.4K | 101.8K | 0.893 | claude-sonnet-5 |  |
| agent-a8421aa151f1ad7cf | plan-feature | 6,7,8,9 (+3 outside) | 11 | 29 | 2.9 | 0/2/8 | n/a/1.00/3.38 | 4.1K | 87.2K | 106.1K | 0.889 | claude-opus-5 |  |
| agent-a8557908c7e262991 | build-feature | 11 (+3 outside) | 23 | 35 | 1.59 | 3/2/17 | 2.00/1.00/1.59 | 97 | 108.9K | 119.9K | 0.96 | claude-sonnet-5 |  |
| agent-a869d038622c63d2e | build-feature | 14 (+5 outside) | 11 | 21 | 2.1 | 0/2/8 | n/a/1.00/2.38 | 1.4K | 73.5K | 79.4K | 0.923 | claude-sonnet-5 |  |
| agent-abb6d1d955ffc5019 | build-feature | 12 | 11 | 15 | 1.5 | 2/1/7 | 2.00/1.00/1.43 | 1.3K | 65.8K | 71.1K | 0.902 | claude-sonnet-5 |  |
| agent-afb800b4edab7fad7 | build-feature | 9 (+6 outside) | 39 | 67 | 1.76 | 1/6/31 | 6.00/3.17/1.35 | 2.3K | 138.3K | 158.3K | 0.974 | claude-sonnet-5 |  |
| agent-afcef55b8ca0c3dea | build-feature | 10 (+5 outside) | 9 | 26 | 3.25 | 2/0/6 | 1.00/n/a/4.00 | 1.6K | 80.3K | 90.0K | 0.904 | claude-sonnet-5 |  |

**10 dispatch(es):** median ctx max 102.6K, peak 158.3K, 0 above the 200,000-token threshold. Distribution: 71.1K, 79.4K, 90.0K, 95.6K, 101.8K, 103.3K, 106.1K, 119.9K, 124.1K, 158.3K.

**All runs:** 2 run(s), wall 55m46s (sum of per-run walls, idle time between runs excluded), 283 turns, 471 tool calls, 103.3K output tokens, cache hit 0.968.

Turn classes across every bucket, read / edit / exec: 37/35/183 turns, 2.81/1.46/1.59 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

85 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 6/1/56).
