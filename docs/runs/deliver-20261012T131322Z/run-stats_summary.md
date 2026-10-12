# Run statistics, run

Generated 2026-10-12 13:39 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 9 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver (20261012T095729Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | MCP verification | 0m19s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Ingest the backlog | 6m28s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Scheduler loop | 18m22s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Final report | 4m39s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 29m48s | 0 | 0 | n/a | 0 | 0 |  | 0 |  | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |

Wall is this run's last step end minus its first step start; steps sum to 29m48s.

## Run: deliver (20261012T131322Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 1 | MCP verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Ingest the backlog | 3m12s | 14 | 27 | 2.08 | 5 | 4.2K | 101.9K | 124.1K | 0 | 0.913 | claude-fable-5-1 | 1/0/10 | 4.00/n/a/1.90 |  |
| 8 | Final report | 4m28s | 12 | 15 | 1.36 | 5 | 5.5K | 97.0K | 265.1K | 0 | 0.937 | claude-fable-5-1 | 2/0/8 | 3.00/n/a/1.00 |  |
| **run total** |  | 25m48s | 26 | 42 | 1.75 | 5 | 9.7K |  | 265.1K |  | 0.924 | claude-fable-5-1 | 3/0/18 | 3.33/n/a/1.50 |  |

Wall is this run's last step end minus its first step start; steps sum to 7m40s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a2d19953e4be36c51 | mayker-dev:orchestrator | n/a | - (+3 outside) | 3 | 9 | 4.5 | 1/0/1 | 6.00/n/a/3.00 | 16 | 44.1K | 50.9K | 0.714 | claude-fable-5-1 |  |
| agent-a37095b7abe5fe6f9 | mayker-dev:orchestrator | n/a | - (+3 outside) | 3 | 3 | 1.5 | 1/0/1 | 2.00/n/a/1.00 | 1.3K | 39.8K | 43.0K | 0.64 | claude-fable-5-1 |  |
| agent-a6fe5cd98fcfdcb1f | mayker-dev:builder | n/a | - (+7 outside) | 7 | 32 | 5.33 | 2/1/3 | 7.50/14.00/1.00 | 1.2K | 87.9K | 102.9K | 0.833 | claude-sonnet-5-5 |  |
| agent-a9d33217cf81af516 | mayker-dev:reviewer | n/a | - (+5 outside) | 5 | 19 | 4.75 | 4/0/0 | 4.75/n/a/n/a | 191 | 64.6K | 81.1K | 0.749 | claude-opus-5-5 |  |
| agent-aa31c0e9d48a9937e | mayker-dev:orchestrator | deliver | 8 | 10 | 13 | 1.44 | 2/0/7 | 3.00/n/a/1.00 | 1.2K | 63.9K | 78.2K | 0.898 | claude-fable-5-1 |  |
| agent-abb1738f83509f4dc | mayker-dev:orchestrator | deliver | 3 | 7 | 19 | 3.17 | 1/0/4 | 4.00/n/a/3.00 | 47 | 84.0K | 112.2K | 0.809 | claude-fable-5-1 |  |
| agent-acc30cfde38b89321 | mayker-dev:planner | n/a | - (+13 outside) | 13 | 28 | 2.33 | 1/0/11 | 9.00/n/a/1.73 | 99 | 93.6K | 113.0K | 0.907 | claude-opus-5-5 |  |
| agent-acc4e115aaa0e1727 | mayker-dev:builder | n/a | - (+6 outside) | 6 | 13 | 2.6 | 1/2/2 | 6.00/2.50/1.00 | 1.3K | 70.6K | 79.5K | 0.846 | claude-sonnet-5-5 |  |
| agent-af1d4eedce948aa32 | mayker-dev:builder | n/a | - (+7 outside) | 7 | 19 | 3.17 | 1/1/4 | 8.00/7.00/1.00 | 1.5K | 79.5K | 90.5K | 0.863 | claude-sonnet-5-5 |  |

**9 dispatch(es)** (mayker-dev:builder 3, mayker-dev:orchestrator 4, mayker-dev:planner 1, mayker-dev:reviewer 1): median ctx max 81.1K, peak 113.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 43.0K, 50.9K, 78.2K, 79.5K, 81.1K, 90.5K, 102.9K, 112.2K, 113.0K.

**All runs:** 2 run(s), wall 55m36s (sum of per-run walls, idle time between runs excluded), 141 turns, 256 tool calls, 56.7K output tokens, cache hit 0.941.

Turn classes across every bucket, read / edit / exec: 21/4/96 turns, 4.10/6.50/1.35 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

115 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 18/4/78).
