# Run statistics, TEST-03

Generated 2026-07-27 21:36 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m12s | 1 | 1 | 1.0 | 1 | 630 | 168.0K | 168.0K | 0 | 0.991 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 1 | MCP Verification | 0m27s | 3 | 3 | 1.0 | 1 | 1.4K | 169.6K | 170.2K | 0 | 0.996 | claude-opus-5 | 0/0/3 | n/a/n/a/1.00 |  |
| 2 | Dependency Check | 0m18s | 1 | 1 | 1.0 | 1 | 969 | 170.8K | 170.8K | 0 | 0.996 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 3 | Fetch Feature Details | 0m09s | 1 | 1 | 1.0 | 1 | 313 | 172.3K | 172.3K | 0 | 0.991 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 4 | Update Status Planning | 0m07s | 1 | 1 | 1.0 | 1 | 336 | 172.6K | 172.6K | 0 | 0.998 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 5 | Create Branch | 0m18s | 2 | 2 | 1.0 | 1 | 938 | 173.2K | 173.3K | 0 | 0.998 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 |  |
| 6 | Read References | 3m04s | 4 | 8 | 2.0 | 3 | 14 | 70.8K | 83.3K | 0 | 0.907 | claude-opus-5 | 0/0/4 | n/a/n/a/2.00 |  |
| 7 | Detect Scaffold Requirement | 0m08s | 1 | 1 | 1.0 | 1 | 3 | 93.9K | 93.9K | 0 | 0.887 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 8 | Generate Architect Plan | 1m53s | 2 | 2 | 1.0 | 1 | 252 | 98.8K | 103.3K | 0 | 0.952 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 9 | Generate Shared Risk Analysis | 0m36s | 2 | 2 | 1.0 | 1 | 2.6K | 104.8K | 106.1K | 0 | 0.987 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 10 | Commit and Push | 0m36s | 4 | 4 | 1.0 | 1 | 1.7K | 180.6K | 181.7K | 0 | 0.996 | claude-opus-5 | 0/0/4 | n/a/n/a/1.00 |  |
| 11 | Create Draft PR | 0m33s | 2 | 2 | 1.0 | 1 | 2.2K | 183.7K | 184.6K | 0 | 0.992 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 |  |
| 12 | Update Status Plan Review | 0m09s | 1 | 1 | 1.0 | 1 | 458 | 185.0K | 185.0K | 0 | 0.998 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 13 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 9m37s | 25 | 29 | 1.16 | 3 | 11.8K |  | 185.0K |  | 0.983 | claude-opus-5 | 0/2/23 | n/a/1.00/1.17 |  |

Wall is this run's last step end minus its first step start; steps sum to 8m30s.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m27s | 1 | 1 | 1.0 | 1 | 1.7K | 216.5K | 216.5K | 0 | 0.996 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 1 | MCP Verification | 0m08s | 1 | 1 | 1.0 | 1 | 529 | 218.3K | 218.3K | 0 | 0.992 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 2 | Dependency Check | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Status and Plan Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 4 | Branch Setup | 0m11s | 1 | 1 | 1.0 | 1 | 575 | 219.0K | 219.0K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Update Status In Progress | 0m09s | 1 | 1 | 1.0 | 1 | 456 | 219.6K | 219.6K | 0 | 0.997 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 6 | Read the Plan | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Phase A, Frontend Implementation | 2m43s | 14 | 22 | 1.57 | 3 | 339 | 107.3K | 116.7K | 0 | 0.986 | claude-sonnet-5 | 0/7/7 | n/a/1.86/1.29 | model!=marker |
| 9 | Phase B, Backend Implementation | 4m39s | 31 | 38 | 1.23 | 5 | 1.7K | 133.3K | 145.1K | 0 | 0.993 | claude-sonnet-5 | 0/15/16 | n/a/1.47/1.00 | model!=marker |
| 10 | Phase C, Integration | 0m24s | 2 | 2 | 1.0 | 1 | 8 | 145.9K | 146.5K | 0 | 0.995 | claude-sonnet-5 | 0/0/2 | n/a/n/a/1.00 | model!=marker |
| 11 | Phase D, E2E Test Generation | 3m29s | 19 | 19 | 1.0 | 1 | 529 | 154.3K | 161.4K | 0 | 0.995 | claude-sonnet-5 | 1/4/14 | 1.00/1.00/1.00 | model!=marker |
| 12 | Phase E, Self-Review | 10m10s | 43 | 77 | 1.88 | 10 | 6.6K | 82.5K | 235.1K | 0 | 0.948 | claude-sonnet-5 | 8/2/29 | 4.88/1.00/1.17 | ctx>threshold, model!=marker |
| 13 | Phase F, Refactor Gate | 4m20s | 21 | 24 | 1.14 | 2 | 587 | 114.4K | 125.6K | 0 | 0.989 | claude-sonnet-5 | 1/2/18 | 1.00/1.00/1.17 | model!=marker |
| 14 | Phase G, UAT Generation | 1m06s | 8 | 9 | 1.12 | 2 | 333 | 130.3K | 133.6K | 0 | 0.992 | claude-sonnet-5 | 1/3/4 | 2.00/1.00/1.00 | model!=marker |
| 15 | Documentation Check | 0m38s | 6 | 7 | 1.17 | 2 | 463 | 136.5K | 138.0K | 0 | 0.995 | claude-sonnet-5 | 1/1/4 | 1.00/1.00/1.25 | model!=marker |
| 16 | Phase H, Artifact Re-check | 3m07s | 14 | 24 | 1.85 | 5 | 2.6K | 103.8K | 245.2K | 0 | 0.93 | claude-sonnet-5 | 11/0/1 | 2.00/n/a/1.00 | ctx>threshold, model!=marker |
| 17 | Push | 1m59s | 10 | 10 | 1.0 | 1 | 5.9K | 250.7K | 253.3K | 0 | 0.997 | claude-opus-5 | 0/1/9 | n/a/1.00/1.00 | ctx>threshold |
| 18 | CI Watch | 11m07s | 38 | 39 | 1.05 | 2 | 24.0K | 162.0K | 291.1K | 0 | 0.981 | claude-sonnet-5 | 2/3/28 | 1.00/1.00/1.07 | ctx>threshold, model!=marker |
| 19 | Handover | 0m20s | 2 | 2 | 1.0 | 1 | 736 | 294.8K | 295.0K | 0 | 0.993 | claude-opus-5 | 0/0/2 | n/a/n/a/1.00 | ctx>threshold |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 49m58s | 212 | 277 | 1.33 | 10 | 47.1K |  | 295.0K |  | 0.981 | claude-sonnet-5 | 25/38/138 | 2.72/1.34/1.09 |  |

Wall is this run's last step end minus its first step start; steps sum to 44m57s.

38 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a380c7958d36806e4 | build-feature | 16 | 12 | 22 | 2.0 | 11/0/0 | 2.00/n/a/n/a | 434 | 80.5K | 95.7K | 0.901 | claude-sonnet-5 |  |
| agent-a942d6c8be0388e49 | build-feature | 12 | 33 | 37 | 1.16 | 2/2/28 | 1.00/1.00/1.18 | 1.6K | 73.0K | 87.3K | 0.964 | claude-sonnet-5 |  |
| agent-aafa63767876a89c9 | plan-feature | 6,7,8,9 (+3 outside) | 12 | 18 | 1.64 | 0/2/9 | n/a/1.00/1.78 | 4.5K | 82.7K | 107.3K | 0.892 | claude-opus-5 |  |
| agent-ac57e5bfa081aa758 | build-feature | 12 | 7 | 37 | 6.17 | 6/0/0 | 6.17/n/a/n/a | 21 | 63.7K | 87.7K | 0.803 | claude-sonnet-5 |  |
| agent-ae019d9d7d7016c2c | build-feature | 13,14,15 (+16 outside) | 51 | 66 | 1.32 | 4/6/40 | 1.50/1.00/1.35 | 1.5K | 115.0K | 141.3K | 0.977 | claude-sonnet-5 |  |
| agent-af01079c88abd1ba6 | build-feature | 18 | 21 | 20 | 1.0 | 1/2/17 | 1.00/1.00/1.00 | 1.5K | 71.6K | 81.8K | 0.946 | claude-sonnet-5 |  |
| agent-afe215d7a8788dc02 | build-feature | 8,9,10,11 (+9 outside) | 75 | 105 | 1.42 | 4/26/44 | 4.50/1.50/1.09 | 4.7K | 132.2K | 163.3K | 0.984 | claude-sonnet-5 |  |

**7 dispatch(es):** median ctx max 95.7K, peak 163.3K, 0 above the 200,000-token threshold. Distribution: 81.8K, 87.3K, 87.7K, 95.7K, 107.3K, 141.3K, 163.3K.

**All runs:** 2 run(s), wall 59m35s (sum of per-run walls, idle time between runs excluded), 305 turns, 419 tool calls, 90.8K output tokens, cache hit 0.974.

Turn classes across every bucket, read / edit / exec: 33/40/206 turns, 2.76/1.32/1.21 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

68 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 8/0/45).
