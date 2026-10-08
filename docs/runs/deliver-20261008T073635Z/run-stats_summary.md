# Run statistics, run

Generated 2026-10-08 08:02 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 10 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 overlapping step window pair(s) detected WITHIN a single invocation; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. A lifecycle's steps are strictly sequential, so this is step markers written out of order by the session that wrote them — a WRITER defect, and no statement at all about how many units ran at once.

**Overlapping windows:** deliver (20261007T214613Z) step 3 and deliver (20261007T214613Z) step 5 overlap by 1164s.

## Run: deliver (20261007T214613Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 20m55s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 1 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Scheduler loop | 34m44s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 1 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Final report | 2m02s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 38m17s | 0 | 0 | n/a | 0 | 0 |  | 0 |  | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |

Wall is this run's last step end minus its first step start; steps sum to 57m41s.

## Run: deliver (20261008T073635Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | MCP verification | 0m22s | 6 | 11 | 1.83 | 3 | 2.4K | 103.8K | 116.7K | 0 | 0.956 | claude-opus-5-5 | 1/0/4 | 3.00/n/a/1.75 |  |
| 3 | Ingest the backlog | 3m28s | 14 | 29 | 2.23 | 9 | 8.1K | 116.2K | 142.4K | 0 | 0.914 | claude-opus-5-5 | 2/2/8 | 3.00/1.50/2.38 |  |
| 5 | The scheduler loop | 18m42s | 104 | 193 | 2.01 | 14 | 39.9K | 131.7K | 236.8K | 0 | 0.946 | claude-opus-5-5 | 15/4/67 | 3.93/5.00/1.55 |  |
| 8 | Final report | 3m12s | 9 | 12 | 1.5 | 5 | 3.1K | 109.7K | 240.8K | 0 | 0.924 | claude-fable-5-1 | 0/0/7 | n/a/n/a/1.57 |  |
| **run total** |  | 25m44s | 133 | 245 | 1.99 | 14 | 53.5K |  | 240.8K |  | 0.942 | claude-opus-5-5 | 18/6/86 | 3.78/3.83/1.64 |  |

Wall is this run's last step end minus its first step start; steps sum to 25m44s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a14aef762fa224153 | mayker-dev:builder | deliver | 5 | 6 | 9 | 1.8 | 0/0/5 | n/a/n/a/1.80 | 789 | 62.9K | 67.2K | 0.86 | claude-sonnet-5-5 |  |
| agent-a34718e412a4b55c6 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 4.00/2.00/1.50 | 578 | 68.1K | 77.6K | 0.845 | claude-sonnet-5-5 |  |
| agent-a406b7a27bc6ac4ec | mayker-dev:orchestrator | deliver | 5 | 4 | 14 | 4.67 | 2/0/1 | 4.50/n/a/5.00 | 17 | 68.3K | 83.7K | 0.694 | claude-fable-5-1 |  |
| agent-a45a0e300a78850d6 | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.0 | 1/0/3 | 1.00/n/a/2.33 | 679 | 70.0K | 81.6K | 0.767 | claude-fable-5-1 |  |
| agent-a9b930f9f64a43742 | mayker-dev:builder | deliver | 5 | 8 | 30 | 4.29 | 1/1/5 | 6.00/14.00/2.00 | 1.5K | 85.3K | 95.6K | 0.86 | claude-sonnet-5-5 |  |
| agent-aa6eeeab335c99353 | mayker-dev:orchestrator | deliver | 3 | 4 | 16 | 5.33 | 1/0/2 | 5.00/n/a/5.50 | 13 | 86.4K | 114.3K | 0.669 | claude-fable-5-1 |  |
| agent-acb2817f5c4b46528 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 4.00/2.00/2.33 | 1.2K | 72.6K | 80.8K | 0.847 | claude-sonnet-5-5 |  |
| agent-accb66dc6c169b0ae | mayker-dev:reviewer | deliver | 5 | 5 | 18 | 4.5 | 4/0/0 | 4.50/n/a/n/a | 26 | 53.7K | 65.1K | 0.758 | claude-opus-5-5 |  |
| agent-ad8b967cd1d64c00c | mayker-dev:planner | deliver | 5 | 14 | 29 | 2.23 | 1/0/12 | 9.00/n/a/1.67 | 6.1K | 111.6K | 134.1K | 0.914 | claude-opus-5-5 |  |
| agent-ae31b04586c2a05d8 | mayker-dev:orchestrator | deliver | 8 | 7 | 10 | 1.67 | 0/0/6 | n/a/n/a/1.67 | 103 | 72.7K | 84.2K | 0.86 | claude-fable-5-1 |  |

**10 dispatch(es)** (mayker-dev:builder 4, mayker-dev:orchestrator 4, mayker-dev:planner 1, mayker-dev:reviewer 1): median ctx max 82.7K, peak 134.1K, 0 above the auto threshold (80% of the serving model's window). Distribution: 65.1K, 67.2K, 77.6K, 80.8K, 81.6K, 83.7K, 84.2K, 95.6K, 114.3K, 134.1K.

**All runs:** 2 run(s), wall 1h04m (sum of per-run walls, idle time between runs excluded), 138 turns, 255 tool calls, 55.4K output tokens, cache hit 0.938.

Turn classes across every bucket, read / edit / exec: 20/6/89 turns, 3.60/3.83/1.65 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

5 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 2/0/3).
