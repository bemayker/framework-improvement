# Run statistics, run

Generated 2026-11-01 02:58 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 10 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 3m16s | 11 | 33 | 3.3 | 7 | 16.8K | 84.5K | 111.4K | 0 | 0.876 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/4.00 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 3m16s | 11 | 33 | 3.3 | 7 | 16.8K | 84.5K | 111.4K | 0 | 0.876 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/4.00 |  |
| 5 | Scheduler loop | 14m11s | 117 | 183 | 1.68 | 7 | 63.9K | 99.3K | 194.9K | 0 | 0.953 | claude-opus-5-5 | 20/14/66 | 3.05/2.14/1.26 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at the final boundary | 1m33s | 8 | 19 | 2.71 | 4 | 7.8K | 79.9K | 175.6K | 0 | 0.894 | claude-fable-5-1 | 1/2/4 | 4.00/3.00/2.25 |  |
| 8 | Final report | 3m48s | 8 | 9 | 1.5 | 3 | 23.3K | 95.2K | 203.5K | 0 | 0.909 | claude-fable-5-1 | 4/1/0 | 1.50/2.00/n/a |  |
| **run total** |  | 21m15s | 136 | 225 | 1.8 | 7 | 104.0K |  | 203.5K |  | 0.945 | claude-opus-5-5 | 25/17/72 (exec 55% of wall) | 2.84/2.12/1.49 |  |

Wall is this run's last step end minus its first step start; steps sum to 21m15s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 11m42s of round trip (command plus model time, ADR 0006 section 2): 55% of wall.

CI wait: 1m33s in `ci-poll.sh` calls; framework wall (wall less CI wait) 19m41s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0ccf53760a32c4a8 | mayker-dev:orchestrator | deliver | 8 | 6 | 6 | 1.5 | 4/0/0 | 1.50/n/a/n/a | 16.5K | 60.3K | 75.8K | 0.832 | claude-fable-5-1 |  |
| agent-a1faee921f0d57517 | mayker-dev:orchestrator | deliver | 5 | 11 | 19 | 1.9 | 3/1/5 | 3.00/1.00/1.60 | 7.2K | 55.3K | 61.9K | 0.923 | claude-fable-5-1 |  |
| agent-a32c4499afebc8e19 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 4.00/2.00/2.25 | 6.8K | 66.2K | 80.0K | 0.86 | claude-fable-5-1 |  |
| agent-a3ae6ecb7c0b91ac4 | mayker-dev:orchestrator | deliver | 3 | 9 | 30 | 3.75 | 1/1/6 | 4.00/2.00/4.00 | 15.1K | 85.9K | 111.4K | 0.856 | claude-fable-5-1 |  |
| agent-a4cf21e4df8a078ae | mayker-dev:orchestrator | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 3.00/1.00/1.00 | 3.9K | 48.7K | 53.3K | 0.863 | claude-fable-5-1 |  |
| agent-a615bde436a739ef9 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 4.00/2.00/1.00 | 3.3K | 64.1K | 70.8K | 0.877 | claude-sonnet-5-5 |  |
| agent-a661185e3182ed3ee | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 4.00/4.00/1.50 | 3.3K | 63.6K | 71.7K | 0.812 | claude-sonnet-5-5 |  |
| agent-a6cdee56161900bcf | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.50/2.00/1.00 | 4.1K | 54.2K | 59.4K | 0.899 | claude-sonnet-5-5 |  |
| agent-a86bc1b171b72f8b6 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 789 | 41.5K | 46.8K | 0.748 | claude-sonnet-5-5 |  |
| agent-ad84acdf827094e21 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 4.2K | 48.6K | 60.0K | 0.691 | claude-opus-5-5 |  |

**10 dispatch(es)** in `deliver` (mayker-dev:builder 4, mayker-dev:orchestrator 5, mayker-dev:reviewer 1): median ctx max 66.3K, peak 111.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 46.8K, 53.3K, 59.4K, 60.0K, 61.9K, 70.8K, 71.7K, 75.8K, 80.0K, 111.4K.

**All runs:** 1 run(s), wall 21m15s (sum of per-run walls, idle time between runs excluded), 136 turns, 225 tool calls, 104.0K output tokens, cache hit 0.945.

Turn classes across every bucket, read / edit / exec: 25/17/72 turns, 2.84/2.12/1.49 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 11m42s of round trip (command plus model time, ADR 0006 section 2): 55% of wall.

All runs: CI wait: 1m33s in `ci-poll.sh` calls; framework wall (wall less CI wait) 19m41s.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 3/0/7).
