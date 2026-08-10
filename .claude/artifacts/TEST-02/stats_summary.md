# Run statistics, TEST-02

Generated 2026-08-10 16:40 UTC. Token metrics: available. Skill load: read.

Subagent transcripts unattributed to any work item: 0.

Context threshold: 200,000 tokens per turn; steps and dispatches whose peak exceeded it are flagged. No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: plan-feature (20260810T154231Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m24s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 1 | MCP Verification | 0m58s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 1m22s | 0 | 0 | n/a | 0 | 0 |  | 0 |  | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |

Wall is this run's last step end minus its first step start; steps sum to 1m22s.

## Run: plan-feature (20260810T154937Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m24s | 1 | 1 | 1.0 | 1 | 1.3K | 93.6K | 93.6K | 0 | 0.98 | claude-fable-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 1 | MCP Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 2 | Dependency Check | 0m53s | 4 | 5 | 1.25 | 2 | 2.7K | 96.0K | 97.3K | 0 | 0.99 | claude-fable-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 3 | Fetch Feature Details | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 4 | Update Status to Planning | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Create Branch | 0m39s | 1 | 1 | 1.0 | 1 | 2.0K | 99.7K | 99.7K | 0 | 0.975 | claude-fable-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 6-9 | Planner dispatch, Sections 6 to 9 | 4m35s | 10 | 18 | 2.0 | 6 | 4.4K | 93.5K | 105.3K | 0 | 0.883 | claude-fable-5 | 0/2/6 | n/a/1.00/2.50 |  |
| 10 | Commit and Push | 3m38s | 12 | 13 | 1.08 | 2 | 10.1K | 115.9K | 127.1K | 0 | 0.984 | claude-fable-5 | 1/1/10 | 1.00/1.00/1.10 |  |
| 11 | Create or Update Draft PR | 1m12s | 4 | 4 | 1.0 | 1 | 4.0K | 134.3K | 135.6K | 0 | 0.984 | claude-fable-5 | 0/1/3 | n/a/1.00/1.00 |  |
| 12 | Update Status to Plan Review | 0m28s | 2 | 2 | 1.0 | 1 | 987 | 136.6K | 136.6K | 0 | 0.996 | claude-fable-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 13 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 11m49s | 34 | 44 | 1.33 | 6 | 25.6K |  | 136.6K |  | 0.96 | claude-fable-5 | 1/4/23 | 1.00/1.00/1.43 |  |

Wall is this run's last step end minus its first step start; steps sum to 11m49s.

## Run: build-feature

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load Context | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 1 | MCP Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 2 | Dependency Check | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Status and Plan Verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 4 | Branch Setup | 0m47s | 2 | 2 | 1.0 | 1 | 2.6K | 203.1K | 203.5K | 0 | 0.993 | claude-fable-5 | 0/0/1 | n/a/n/a/1.00 | ctx>threshold |
| 5 | Update Status to In Progress | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 6 | Read the Plan | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 9 | Phase B, Backend Implementation | 3m55s | 11 | 31 | 3.1 | 9 | 5.5K | 109.3K | 211.6K | 0 | 0.913 | claude-opus-5 | 2/2/5 | 7.50/4.50/1.20 | ctx>threshold, model!=marker |
| 11 | Phase D, E2E Test Generation | 3m05s | 11 | 19 | 1.9 | 8 | 3.4K | 106.0K | 216.6K | 0 | 0.937 | claude-opus-5 | 1/1/7 | 3.00/1.00/2.00 | ctx>threshold, model!=marker |
| 12 | Phase E, Self-Review | 5m38s | 11 | 36 | 3.6 | 8 | 6.5K | 115.6K | 227.5K | 0 | 0.92 | claude-opus-5 | 7/0/2 | 4.71/n/a/1.00 | ctx>threshold, model!=marker |
| 13 | Phase F, Refactor Gate | 4m05s | 15 | 31 | 2.21 | 8 | 4.3K | 107.1K | 235.8K | 0 | 0.934 | claude-opus-5 | 2/4/7 | 7.50/1.00/1.57 | ctx>threshold, model!=marker |
| 14 | Phase G, UAT Generation | 2m30s | 10 | 15 | 1.67 | 5 | 5.6K | 109.8K | 239.8K | 0 | 0.937 | claude-opus-5 | 2/2/4 | 2.00/1.00/2.00 | ctx>threshold, model!=marker |
| 15 | Documentation Check | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 16 | Phase H, Artifact Re-check | 5m30s | 8 | 23 | 3.29 | 6 | 2.2K | 114.7K | 246.9K | 0 | 0.89 | claude-opus-5 | 5/0/1 | 4.20/n/a/1.00 | ctx>threshold, model!=marker |
| 17 | Push | 7m47s | 13 | 15 | 1.25 | 3 | 8.6K | 182.9K | 264.9K | 0 | 0.964 | claude-fable-5 | 2/2/7 | 2.00/1.50/1.00 | ctx>threshold |
| 18 | CI Watch | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 19 | Handover | 0m36s | 1 | 1 | 1.0 | 1 | 114 | 265.5K | 265.5K | 0 | 0.998 | claude-fable-5 | 0/0/0 | n/a/n/a/n/a | ctx>threshold |
| 20 | Summary | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 33m53s | 82 | 173 | 2.31 | 9 | 38.9K |  | 265.5K |  | 0.938 | claude-opus-5 | 21/11/34 | 4.52/1.73/1.47 |  |

Wall is this run's last step end minus its first step start; steps sum to 33m53s.

24 turn(s) exceeded the 200,000-token context threshold.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a07375dc60897bf8e | mayker-dev:planner | plan-feature | 6-9 | 8 | 16 | 2.29 | 0/2/5 | n/a/1.00/2.80 | 1.2K | 91.0K | 104.2K | 0.857 | claude-fable-5 |  |
| agent-a21259813b7c3a15f | mayker-dev:builder | build-feature | 13 | 13 | 29 | 2.42 | 2/4/6 | 7.50/1.00/1.67 | 654 | 87.7K | 97.0K | 0.915 | claude-opus-5 |  |
| agent-a47024ba351f3d91d | mayker-dev:builder | build-feature | 11 | 9 | 17 | 2.12 | 1/1/6 | 3.00/1.00/2.17 | 35 | 81.8K | 87.5K | 0.907 | claude-opus-5 |  |
| agent-a59776eaa2e8aa331 | mayker-dev:builder | build-feature | 17 | 5 | 7 | 1.75 | 1/1/2 | 3.00/2.00/1.00 | 146 | 66.1K | 68.6K | 0.792 | claude-opus-5 |  |
| agent-a612971bf7a08cb9d | mayker-dev:reviewer | build-feature | 16 | 6 | 21 | 4.2 | 5/0/0 | 4.20/n/a/n/a | 23 | 71.4K | 93.9K | 0.781 | claude-opus-5 |  |
| agent-a94b9264adde43170 | mayker-dev:builder | build-feature | 14 | 8 | 13 | 1.86 | 2/2/3 | 2.00/1.00/2.33 | 2.3K | 77.6K | 84.0K | 0.896 | claude-opus-5 |  |
| agent-ac05a8cf1237f5203 | mayker-dev:builder | build-feature | 9 | 9 | 29 | 3.62 | 2/2/4 | 7.50/4.50/1.25 | 2.0K | 87.1K | 96.3K | 0.877 | claude-opus-5 |  |
| agent-af863944e423525d0 | mayker-dev:reviewer | build-feature | 12 | 8 | 33 | 4.71 | 7/0/0 | 4.71/n/a/n/a | 42 | 75.1K | 90.5K | 0.849 | claude-opus-5 |  |

**8 dispatch(es)** (mayker-dev:builder 5, mayker-dev:planner 1, mayker-dev:reviewer 2): median ctx max 92.2K, peak 104.2K, 0 above the 200,000-token threshold. Distribution: 68.6K, 84.0K, 87.5K, 90.5K, 93.9K, 96.3K, 97.0K, 104.2K.

**All runs:** 3 run(s), wall 47m04s (sum of per-run walls, idle time between runs excluded), 127 turns, 235 tool calls, 74.9K output tokens, cache hit 0.941.

Turn classes across every bucket, read / edit / exec: 26/15/63 turns, 3.85/1.53/1.54 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

11 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 4/0/6).
