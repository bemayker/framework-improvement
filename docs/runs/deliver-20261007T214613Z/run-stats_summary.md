# Run statistics, run

Generated 2026-10-07 22:25 UTC. Token metrics: available. Skill load: injected.

Subagent dispatches: 17 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 overlapping step window pair(s) detected WITHIN a single invocation; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. A lifecycle's steps are strictly sequential, so this is step markers written out of order by the session that wrote them — a WRITER defect, and no statement at all about how many units ran at once.

**Overlapping windows:** deliver step 3 and deliver step 5 overlap by 1164s.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 20m55s | 137 | 207 | 1.62 | 13 | 43.4K | 157.5K | 248.3K | 1 | 0.959 | claude-opus-5-5 | 13/4/80 | 4.00/4.75/1.31 |  |
| 5 | Scheduler loop | 34m44s | 83 | 130 | 1.71 | 8 | 29.6K | 202.1K | 319.8K | 1 | 0.966 | claude-opus-5-5 | 9/2/46 | 4.56/2.00/1.43 |  |
| 8 | Final report | 2m02s | 11 | 12 | 1.2 | 3 | 5.6K | 212.8K | 330.8K | 0 | 0.968 | claude-opus-5-5 | 0/0/7 | n/a/n/a/1.29 |  |
| **run total** |  | 38m17s | 231 | 349 | 1.63 | 13 | 78.6K |  | 330.8K |  | 0.962 | claude-opus-5-5 | 22/6/133 | 4.23/3.83/1.35 |  |

Wall is this run's last step end minus its first step start; steps sum to 57m41s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0db8a7c2bb7c2bad | mayker-dev:orchestrator | deliver | 5 | 3 | 6 | 2.0 | 1/0/1 | 4.00/n/a/1.00 | 13 | 64.8K | 69.5K | 0.642 | claude-fable-5-1 |  |
| agent-a0e720ccaa5a037cf | mayker-dev:planner | deliver | 5 | 11 | 18 | 1.64 | 1/0/9 | 4.00/n/a/1.44 | 110 | 99.9K | 116.3K | 0.894 | claude-opus-5-5 |  |
| agent-a210d454da9b0ec70 | mayker-dev:orchestrator | deliver | 3 | 6 | 8 | 1.33 | 0/0/5 | n/a/n/a/1.40 | 62 | 82.8K | 95.8K | 0.807 | claude-fable-5-1 |  |
| agent-a2ea80ed6ada5e10e | mayker-dev:orchestrator | deliver | 3 | 3 | 6 | 2.0 | 1/0/1 | 4.00/n/a/1.00 | 8 | 64.8K | 69.4K | 0.642 | claude-fable-5-1 |  |
| agent-a403ba110ee55e08b | mayker-dev:builder | deliver | 5 | 2 | 4 | 2.0 | 1/0/0 | 3.00/n/a/n/a | 22 | 62.9K | 68.1K | 0.647 | claude-sonnet-5-5 |  |
| agent-a4fab6d0adf47dd57 | mayker-dev:builder | deliver | 3 | 6 | 12 | 2.0 | 1/1/3 | 2.00/2.00/2.33 | 95 | 77.2K | 83.9K | 0.87 | claude-sonnet-5-5 |  |
| agent-a512ae359f6e8baf4 | mayker-dev:reviewer | deliver | 3 | 3 | 16 | 5.33 | 2/0/0 | 7.50/n/a/n/a | 25 | 55.9K | 78.5K | 0.532 | claude-opus-5-5 |  |
| agent-a67ca8f20fe4356e7 | mayker-dev:orchestrator | deliver | 3 | 4 | 7 | 1.75 | 1/0/2 | 4.00/n/a/1.00 | 99 | 79.8K | 94.4K | 0.774 | claude-fable-5-1 |  |
| agent-a87a7af6b06ece857 | mayker-dev:builder | deliver | 3 | 5 | 13 | 2.6 | 2/0/2 | 5.00/n/a/1.00 | 83 | 84.2K | 94.0K | 0.833 | claude-sonnet-5-5 |  |
| agent-a92a49183a284bc96 | mayker-dev:orchestrator | deliver | 3 | 3 | 9 | 3.0 | 0/0/2 | n/a/n/a/4.00 | 15 | 70.0K | 78.3K | 0.733 | claude-fable-5-1 |  |
| agent-aad8f15f01c654afb | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.2 | 1/1/2 | 6.00/2.00/1.00 | 65 | 71.2K | 75.7K | 0.787 | claude-sonnet-5-5 |  |
| agent-ab156a9931bdafd40 | mayker-dev:builder | deliver | 3 | 7 | 27 | 3.86 | 2/1/3 | 5.00/13.00/1.00 | 83 | 100.5K | 112.5K | 0.84 | claude-sonnet-5-5 |  |
| agent-ab685baba688ef5fb | mayker-dev:planner | deliver | 3 | 13 | 20 | 1.54 | 1/0/11 | 4.00/n/a/1.36 | 160 | 109.4K | 137.0K | 0.904 | claude-opus-5-5 |  |
| agent-abaed6bfd8bf70765 | mayker-dev:orchestrator | deliver | 8 | 5 | 7 | 1.4 | 0/0/4 | n/a/n/a/1.50 | 120 | 77.3K | 85.1K | 0.837 | claude-fable-5-1 |  |
| agent-ac3da3b0544e8adff | mayker-dev:orchestrator | deliver | 5 | 3 | 10 | 3.33 | 1/0/1 | 8.00/n/a/1.00 | 17 | 81.0K | 94.5K | 0.703 | claude-fable-5-1 |  |
| agent-ae702f8e40668863f | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 4.33 | 2/0/0 | 6.00/n/a/n/a | 27 | 50.9K | 65.1K | 0.574 | claude-opus-5-5 |  |
| agent-af32486c44213f0c2 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.33 | 1/1/3 | 3.00/2.00/2.67 | 85 | 79.8K | 86.4K | 0.869 | claude-sonnet-5-5 |  |

**17 dispatch(es)** (mayker-dev:builder 6, mayker-dev:orchestrator 7, mayker-dev:planner 2, mayker-dev:reviewer 2): median ctx max 85.1K, peak 137.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 65.1K, 68.1K, 69.4K, 69.5K, 75.7K, 78.3K, 78.5K, 83.9K, 85.1K, 86.4K, 94.0K, 94.4K, 94.5K, 95.8K, 112.5K, 116.3K, 137.0K.

**All runs:** 1 run(s), wall 38m17s (sum of per-run walls, idle time between runs excluded), 231 turns, 349 tool calls, 78.6K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 22/6/133 turns, 4.23/3.83/1.35 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

13 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 1/0/11).
