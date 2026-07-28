# Run statistics, TEST-05

Generated 2026-07-28 12:40 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | Update Status Planning | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Create Branch | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read References | 1m22s | 3 | 5 | 1.67 | 3 | 79 | 97.7K | 100.0K | 0 | 0.981 | claude-opus-5 | 1/0/2 | 3.00/n/a/1.00 |  |
| 7 | Detect Scaffold Requirement | 0m08s | 1 | 1 | 1.0 | 1 | 2 | 105.2K | 105.2K | 0 | 0.951 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 8 | Generate Architect Plan | 1m18s | 2 | 2 | 1.0 | 1 | 6 | 108.7K | 111.6K | 0 | 0.97 | claude-opus-5 | 0/1/1 | n/a/1.00/1.00 |  |
| 9 | Generate Shared Risk Analysis | 0m40s | 3 | 3 | 1.0 | 1 | 303 | 113.8K | 115.5K | 0 | 0.989 | claude-opus-5 | 0/1/2 | n/a/1.00/1.00 |  |
| 10 | Commit and Push | 0m02s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 11 | Create Draft PR | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 12 | Update Status Plan Review | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 5m23s | 9 | 11 | 1.22 | 3 | 390 |  | 115.5K |  | 0.978 | claude-opus-5 | 1/2/6 | 3.00/1.00/1.00 |  |

Wall is this run's last step end minus its first step start; steps sum to 3m30s.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | Update Status In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 9 | Phase B, Backend Implementation | 2m43s | 23 | 28 | 1.22 | 5 | 1.0K | 132.4K | 140.2K | 0 | 0.972 | claude-sonnet-5 | 2/8/13 | 3.00/1.00/1.08 |  |
| 12 | Phase E, Self-Review | 3m10s | 9 | 23 | 2.88 | 7 | 4.7K | 150.1K | 398.4K | 0 | 0.922 | claude-sonnet-5 | 6/0/1 | 3.33/n/a/1.00 | ctx>threshold |
| 13 | Phase F, Refactor Gate | 1m05s | 7 | 8 | 1.14 | 2 | 1.5K | 128.8K | 130.7K | 0 | 0.957 | claude-sonnet-5 | 0/1/6 | n/a/1.00/1.17 |  |
| 15 | Documentation Check | 2m34s | 2 | 3 | 1.5 | 2 | 4.7K | 409.6K | 411.0K | 0 | 0.995 | claude-opus-5 | 0/0/1 | n/a/n/a/2.00 | ctx>threshold |
| 17 | Push | 2m12s | 1 | 1 | 1.0 | 1 | 600 | 415.5K | 415.5K | 0 | 0.989 | claude-opus-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 18 | CI Watch | 3m44s | 6 | 6 | 1.0 | 1 | 8.5K | 420.8K | 425.2K | 0 | 0.996 | claude-opus-5 | 0/0/5 | n/a/n/a/1.00 | ctx>threshold |
| 19 | Handover | 0m03s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 18m24s | 48 | 69 | 1.47 | 7 | 21.0K |  | 425.2K |  | 0.973 | claude-sonnet-5 | 8/9/27 | 3.25/1.00/1.11 |  |

Wall is this run's last step end minus its first step start; steps sum to 15m31s.

11 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a55d36a89b5b8049c | plan-feature | 6,7,8,9 (+3 outside) | 12 | 19 | 1.73 | 1/2/8 | 3.00/1.00/1.75 | 397 | 101.4K | 116.6K | 0.915 | claude-opus-5 |  |
| agent-a78fc61e9782bcc92 | build-feature | 9 (+4 outside) | 27 | 39 | 1.5 | 2/8/16 | 3.00/1.00/1.56 | 2.1K | 130.5K | 141.6K | 0.966 | claude-sonnet-5 |  |
| agent-a7ffb77f519cb97b9 | build-feature | 13 (+3 outside) | 10 | 23 | 2.56 | 0/1/8 | n/a/1.00/2.75 | 1.5K | 118.0K | 131.0K | 0.903 | claude-sonnet-5 |  |
| agent-ae176ded75d47519b | build-feature | 12 | 7 | 20 | 3.33 | 6/0/0 | 3.33/n/a/n/a | 38 | 80.3K | 95.4K | 0.83 | claude-sonnet-5 |  |

**4 dispatch(es):** median ctx max 123.8K, peak 141.6K, 0 above the 200,000-token threshold. Distribution: 95.4K, 116.6K, 131.0K, 141.6K.

**All runs:** 2 run(s), wall 23m47s (sum of per-run walls, idle time between runs excluded), 312 turns, 401 tool calls, 282.3K output tokens, cache hit 0.984.

Turn classes across every bucket, read / edit / exec: 20/32/200 turns, 2.00/1.00/1.23 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

255 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 11/21/167).
