# Run statistics, TEST-05

Generated 2026-08-10 10:19 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | Update Status Planning | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Create Branch | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read References | 1m22s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 7 | Detect Scaffold Requirement | 0m08s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Generate Architect Plan | 1m18s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 9 | Generate Shared Risk Analysis | 0m40s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 10 | Commit and Push | 0m02s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 11 | Create Draft PR | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 12 | Update Status Plan Review | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 5m23s | 0 | 0 | n/a | 0 | 0 |  | 0 |  | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |

Wall is this run's last step end minus its first step start; steps sum to 3m30s.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | Update Status In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 9 | Phase B, Backend Implementation | 2m43s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | sonnet (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 12 | Phase E, Self-Review | 3m10s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | sonnet (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 13 | Phase F, Refactor Gate | 1m05s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | sonnet (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 15 | Documentation Check | 2m34s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 17 | Push | 2m12s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 18 | CI Watch | 3m44s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 19 | Handover | 0m03s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | opus (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 18m24s | 0 | 0 | n/a | 0 | 0 |  | 0 |  | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |

Wall is this run's last step end minus its first step start; steps sum to 15m31s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a2b661438e345e962 | n/a | - (+5 outside) | 5 | 23 | 5.75 | 4/0/0 | 5.75/n/a/n/a | 412 | 91.9K | 132.3K | 0.712 | claude-opus-5 |  |
| agent-a39191c390dabf074 | n/a | - (+12 outside) | 12 | 23 | 2.09 | 1/4/6 | 7.00/1.00/2.00 | 3.3K | 91.2K | 104.4K | 0.905 | claude-opus-5 |  |
| agent-a569094f5991cb739 | n/a | - (+10 outside) | 10 | 35 | 3.89 | 1/2/6 | 4.00/6.00/3.17 | 33 | 120.0K | 140.2K | 0.824 | claude-opus-5 |  |
| agent-a6c05bb03eb682033 | n/a | - (+15 outside) | 15 | 43 | 3.07 | 3/5/6 | 7.33/1.80/2.00 | 2.7K | 106.6K | 123.5K | 0.875 | claude-opus-5 |  |

**4 dispatch(es):** median ctx max 127.9K, peak 140.2K, 0 above the 200,000-token threshold. Distribution: 104.4K, 123.5K, 132.3K, 140.2K.

**All runs:** 2 run(s), wall 23m47s (sum of per-run walls, idle time between runs excluded), 42 turns, 124 tool calls, 6.4K output tokens, cache hit 0.851.

Turn classes across every bucket, read / edit / exec: 9/11/18 turns, 6.22/2.27/2.39 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

42 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 9/11/18).
