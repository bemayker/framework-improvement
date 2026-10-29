# Run statistics, run

Generated 2026-10-29 11:19 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 20 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 2m58s | 11 | 24 | 2.4 | 7 | 14.9K | 84.3K | 107.0K | 0 | 0.866 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/2.50 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 2m58s | 11 | 24 | 2.4 | 7 | 14.9K | 84.3K | 107.0K | 0 | 0.866 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/2.50 |  |
| 5 | Scheduler loop | 30m05s | 227 | 436 | 2.09 | 9 | 149.9K | 112.4K | 243.7K | 0 | 0.948 | claude-opus-5-5 | 32/28/135 | 3.88/2.04/1.72 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at wave 2 boundary | 16m32s | 112 | 230 | 2.25 | 9 | 82.8K | 120.6K | 234.4K | 1 | 0.947 | claude-opus-5-5 | 14/16/66 | 4.79/2.19/1.80 |  |
| 8 | Final report | 2m51s | 12 | 14 | 1.4 | 3 | 18.2K | 89.1K | 252.4K | 0 | 0.945 | claude-fable-5-1 | 4/1/4 | 1.50/2.00/1.25 |  |
| **run total** |  | 35m54s | 250 | 474 | 2.07 | 9 | 183.0K |  | 252.4K |  | 0.945 | claude-opus-5-5 | 37/31/145 (exec 80% of wall) | 3.62/2.03/1.74 |  |

Wall is this run's last step end minus its first step start; steps sum to 35m54s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 28m36s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

CI wait: 2m58s in `ci-poll.sh` calls; framework wall (wall less CI wait) 32m56s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0a20fb76a4e88c7c | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 819 | 45.4K | 52.7K | 0.727 | claude-sonnet-5-5 |  |
| agent-a138583cc4126dbf5 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 3.00/1.00/2.75 | 4.4K | 50.1K | 56.2K | 0.839 | claude-fable-5-1 |  |
| agent-a23415298bc193eb0 | mayker-dev:orchestrator | deliver | 8 | 10 | 11 | 1.38 | 4/0/4 | 1.50/n/a/1.25 | 11.7K | 57.1K | 64.9K | 0.912 | claude-fable-5-1 |  |
| agent-a426e1b62bef4c441 | mayker-dev:planner | deliver | 5 | 13 | 33 | 2.75 | 1/2/8 | 9.00/1.50/2.25 | 13.9K | 106.6K | 125.5K | 0.909 | claude-opus-5-5 |  |
| agent-a4340be61040b2f44 | mayker-dev:builder | deliver | 5 | 11 | 15 | 1.5 | 2/2/6 | 2.00/1.50/1.33 | 6.3K | 65.8K | 74.5K | 0.918 | claude-sonnet-5-5 |  |
| agent-a50645a8ee6fbcf4f | mayker-dev:planner | deliver | 5 | 13 | 34 | 2.83 | 2/2/7 | 3.50/1.50/2.71 | 14.6K | 95.0K | 118.2K | 0.904 | claude-opus-5-5 |  |
| agent-a7132dc779bca0e3d | mayker-dev:builder | deliver | 5 | 2 | 3 | 3.0 | 1/0/0 | 3.00/n/a/n/a | 1.0K | 45.2K | 53.6K | 0.579 | claude-sonnet-5-5 |  |
| agent-a719c341b6794a46e | mayker-dev:builder | deliver | 5 | 10 | 15 | 1.67 | 2/2/5 | 2.00/1.50/1.60 | 6.9K | 66.3K | 75.3K | 0.91 | claude-sonnet-5-5 |  |
| agent-a8a4330d5bb846fab | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 4.00/2.00/2.50 | 7.0K | 67.1K | 80.2K | 0.861 | claude-fable-5-1 |  |
| agent-a8c3913e0344ba471 | mayker-dev:orchestrator | deliver | 5 | 9 | 18 | 2.25 | 1/1/6 | 4.00/2.00/2.00 | 7.0K | 65.1K | 75.4K | 0.897 | claude-fable-5-1 |  |
| agent-aa70c7a364c6618a1 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 1/1/3 | 4.00/8.00/3.00 | 6.7K | 70.4K | 82.9K | 0.804 | claude-sonnet-5-5 |  |
| agent-ab1baef89b51c865a | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 1/1/4 | 4.00/1.00/1.75 | 5.1K | 50.8K | 55.9K | 0.842 | claude-fable-5-1 |  |
| agent-ab4fe51404d600400 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 5.50/2.00/1.00 | 3.3K | 73.1K | 81.9K | 0.87 | claude-sonnet-5-5 |  |
| agent-acd5ac8ab38ff2e63 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 3.8K | 46.5K | 56.0K | 0.699 | claude-opus-5-5 |  |
| agent-ad62691984d5b6741 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 4.00/1.00/1.25 | 3.1K | 55.9K | 61.1K | 0.898 | claude-sonnet-5-5 |  |
| agent-adc0fea5dc486cd58 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 1/1/3 | 7.00/1.00/3.33 | 6.5K | 58.7K | 66.7K | 0.874 | claude-fable-5-1 |  |
| agent-adf13b67497c02072 | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 4.7K | 49.8K | 61.8K | 0.69 | claude-opus-5-5 |  |
| agent-ae64953c9d58d30a5 | mayker-dev:builder | deliver | 5 | 8 | 19 | 2.71 | 2/1/4 | 3.00/6.00/1.75 | 4.5K | 70.6K | 79.7K | 0.859 | claude-sonnet-5-5 |  |
| agent-ae91f0ef0c003630a | mayker-dev:orchestrator | deliver | 5 | 9 | 21 | 2.62 | 1/1/5 | 7.00/1.00/2.20 | 6.4K | 61.9K | 70.4K | 0.9 | claude-fable-5-1 |  |
| agent-aee978d56b278bf83 | mayker-dev:orchestrator | deliver | 3 | 8 | 20 | 2.86 | 1/1/5 | 4.00/2.00/2.80 | 13.3K | 85.6K | 107.0K | 0.843 | claude-fable-5-1 |  |

**20 dispatch(es)** in `deliver` (mayker-dev:builder 8, mayker-dev:orchestrator 8, mayker-dev:planner 2, mayker-dev:reviewer 2): median ctx max 72.4K, peak 125.5K, 0 above the auto threshold (80% of the serving model's window). Distribution: 52.7K, 53.6K, 55.9K, 56.0K, 56.2K, 61.1K, 61.8K, 64.9K, 66.7K, 70.4K, 74.5K, 75.3K, 75.4K, 79.7K, 80.2K, 81.9K, 82.9K, 107.0K, 118.2K, 125.5K.

**All runs:** 1 run(s), wall 35m54s (sum of per-run walls, idle time between runs excluded), 250 turns, 474 tool calls, 183.0K output tokens, cache hit 0.945.

Turn classes across every bucket, read / edit / exec: 37/31/145 turns, 3.62/2.03/1.74 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 28m36s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

All runs: CI wait: 2m58s in `ci-poll.sh` calls; framework wall (wall less CI wait) 32m56s.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/8).
