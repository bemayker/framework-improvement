# Run statistics, run

Generated 2026-10-12 10:27 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 11 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | MCP verification | 0m19s | 6 | 8 | 1.33 | 2 | 1.6K | 76.3K | 96.1K | 0 | 0.921 | claude-opus-5-5 | 1/0/3 | 2.00/n/a/1.33 |  |
| 3 | Ingest the backlog | 6m28s | 20 | 40 | 2.22 | 10 | 8.4K | 118.5K | 152.3K | 0 | 0.865 | claude-fable-5-1 | 2/0/14 | 1.50/n/a/2.50 |  |
| 5 | Scheduler loop | 18m22s | 134 | 225 | 1.89 | 13 | 61.5K | 163.9K | 296.7K | 0 | 0.966 | claude-sonnet-5-5 | 17/3/85 | 4.18/5.67/1.45 |  |
| 8 | Final report | 4m39s | 10 | 14 | 1.56 | 5 | 7.6K | 161.9K | 307.7K | 0 | 0.952 | claude-fable-5-1 | 1/0/7 | 5.00/n/a/1.14 |  |
| **run total** |  | 29m48s | 170 | 287 | 1.89 | 13 | 79.0K |  | 307.7K |  | 0.955 | claude-sonnet-5-5 | 21/3/109 | 3.86/5.67/1.56 |  |

Wall is this run's last step end minus its first step start; steps sum to 29m48s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a2eb3b1d80c75179d | mayker-dev:reviewer | deliver | 5 | 4 | 17 | 5.67 | 3/0/0 | 5.67/n/a/n/a | 23 | 57.6K | 78.3K | 0.66 | claude-opus-5-5 |  |
| agent-a2eea87aaeaae705d | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 7.00/2.00/2.00 | 1.5K | 60.2K | 70.4K | 0.84 | claude-sonnet-5-5 |  |
| agent-a360212e0671bd316 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 13 | 46.5K | 60.1K | 0.569 | claude-opus-5-5 |  |
| agent-a364a3d94c20bd653 | mayker-dev:orchestrator | deliver | 5 | 3 | 7 | 3.5 | 1/0/1 | 6.00/n/a/1.00 | 18 | 43.3K | 50.8K | 0.609 | claude-fable-5-1 |  |
| agent-a4f709e87c28ae610 | mayker-dev:orchestrator | deliver | 5 | 5 | 6 | 1.5 | 2/0/2 | 2.00/n/a/1.00 | 348 | 44.3K | 53.2K | 0.76 | claude-fable-5-1 |  |
| agent-a8f5fd27f56e191d7 | mayker-dev:orchestrator | deliver | 5 | 7 | 9 | 1.5 | 0/0/6 | n/a/n/a/1.50 | 690 | 44.9K | 50.1K | 0.84 | claude-fable-5-1 |  |
| agent-a9fb5627f7b733d3e | mayker-dev:orchestrator | deliver | 8 | 6 | 10 | 2.0 | 1/0/4 | 5.00/n/a/1.25 | 1.3K | 67.8K | 80.3K | 0.834 | claude-fable-5-1 |  |
| agent-ac2891b49715a6dd2 | mayker-dev:orchestrator | deliver | 3 | 7 | 23 | 3.83 | 0/0/6 | n/a/n/a/3.83 | 51 | 83.8K | 120.2K | 0.795 | claude-fable-5-1 |  |
| agent-ad5b344f4e208ce53 | mayker-dev:planner | deliver | 5 | 14 | 23 | 1.77 | 2/0/11 | 3.50/n/a/1.45 | 4.6K | 89.3K | 107.9K | 0.914 | claude-opus-5-5 |  |
| agent-ae834ab5f008c2c96 | mayker-dev:builder | deliver | 5 | 4 | 11 | 3.67 | 1/0/2 | 5.00/n/a/3.00 | 518 | 58.7K | 70.4K | 0.754 | claude-sonnet-5-5 |  |
| agent-af2ac300cacba39dd | mayker-dev:builder | deliver | 5 | 9 | 32 | 4.0 | 1/2/5 | 6.00/7.50/2.20 | 1.1K | 76.6K | 87.5K | 0.873 | claude-sonnet-5-5 |  |

**11 dispatch(es)** (mayker-dev:builder 3, mayker-dev:orchestrator 5, mayker-dev:planner 1, mayker-dev:reviewer 2): median ctx max 70.4K, peak 120.2K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.1K, 50.8K, 53.2K, 60.1K, 70.4K, 70.4K, 78.3K, 80.3K, 87.5K, 107.9K, 120.2K.

**All runs:** 1 run(s), wall 29m48s (sum of per-run walls, idle time between runs excluded), 170 turns, 287 tool calls, 79.0K output tokens, cache hit 0.955.

Turn classes across every bucket, read / edit / exec: 21/3/109 turns, 3.86/5.67/1.56 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

5 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/3).
