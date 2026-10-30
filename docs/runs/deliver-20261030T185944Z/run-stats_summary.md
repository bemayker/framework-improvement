# Run statistics, run

Generated 2026-10-30 20:02 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 45 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 3m24s | 12 | 23 | 2.09 | 5 | 16.5K | 89.4K | 112.7K | 0 | 0.878 | claude-fable-5-1 | 1/4/6 | 4.00/1.50/2.17 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 3m24s | 12 | 23 | 2.09 | 5 | 16.5K | 89.4K | 112.7K | 0 | 0.878 | claude-fable-5-1 | 1/4/6 | 4.00/1.50/2.17 |  |
| 5 | Scheduler loop | 55m45s | 490 | 940 | 2.21 | 13 | 374.9K | 139.0K | 446.8K | 0 | 0.958 | claude-opus-5-5 | 67/61/287 | 4.48/2.21/1.70 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at wave 2 boundary | 34m43s | 208 | 397 | 2.24 | 10 | 165.4K | 171.7K | 444.5K | 1 | 0.966 | claude-opus-5-5 | 25/28/120 | 4.40/2.18/1.84 |  |
| 8 | Final report | 3m02s | 8 | 9 | 1.29 | 3 | 18.0K | 205.3K | 461.1K | 0 | 0.951 | claude-fable-5-1 | 2/1/3 | 2.00/1.00/1.00 |  |
| **run total** |  | 1h02m | 510 | 972 | 2.19 | 13 | 409.4K |  | 461.1K |  | 0.957 | claude-opus-5-5 | 70/66/296 (exec 89% of wall) | 4.40/2.15/1.71 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h02m.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 55m24s of round trip (command plus model time, ADR 0006 section 2): 89% of wall.

CI wait: 15m36s in `ci-poll.sh` calls; framework wall (wall less CI wait) 46m35s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0cb905a952c0d2cd | mayker-dev:planner | deliver | 5 | 13 | 28 | 2.33 | 0/2/10 | n/a/1.50/2.50 | 12.4K | 89.0K | 106.8K | 0.919 | claude-opus-5-5 |  |
| agent-a120cd7effee22959 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/2/2 | 4.50/1.50/1.00 | 3.0K | 52.5K | 57.3K | 0.88 | claude-sonnet-5-5 |  |
| agent-a16c39de47a2e0394 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 6.00/1.00/1.00 | 3.2K | 55.3K | 62.3K | 0.852 | claude-sonnet-5-5 |  |
| agent-a18f80e2610ef510d | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 1/1/5 | 4.00/2.00/2.80 | 13.4K | 77.8K | 99.4K | 0.86 | claude-fable-5-1 |  |
| agent-a1f7fa25121738ef1 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 1/1/3 | 7.00/1.00/1.33 | 4.8K | 49.4K | 53.7K | 0.881 | claude-fable-5-1 |  |
| agent-a21ce2acd7854f19e | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 7.00/1.00/1.67 | 5.0K | 52.9K | 59.4K | 0.812 | claude-fable-5-1 |  |
| agent-a2d8d15092ab14565 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/2/1 | 3.00/3.50/1.00 | 3.6K | 52.7K | 59.2K | 0.855 | claude-sonnet-5-5 |  |
| agent-a312fe7fff13688ac | mayker-dev:planner | deliver | 5 | 16 | 34 | 2.27 | 2/2/11 | 6.00/1.50/1.73 | 21.7K | 102.0K | 124.0K | 0.924 | claude-opus-5-5 |  |
| agent-a31e39576fbdc51f0 | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 3.50/1.00/1.50 | 4.4K | 52.7K | 60.8K | 0.855 | claude-fable-5-1 |  |
| agent-a322b6ac08b65fd9f | mayker-dev:planner | deliver | 5 | 12 | 30 | 2.73 | 1/2/8 | 1.00/1.50/3.25 | 12.9K | 92.7K | 109.9K | 0.901 | claude-opus-5-5 |  |
| agent-a394de06901510cbd | mayker-dev:orchestrator | deliver | 5 | 8 | 13 | 1.86 | 1/1/5 | 4.00/1.00/1.60 | 4.7K | 50.6K | 57.2K | 0.89 | claude-fable-5-1 |  |
| agent-a3b8d00b21bd1fbc1 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 1/0/2 | 2.00/n/a/2.00 | 1.7K | 38.2K | 40.5K | 0.822 | claude-sonnet-5-5 |  |
| agent-a3ba94806770e4ed1 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 4.2K | 45.8K | 62.9K | 0.542 | claude-opus-5-5 |  |
| agent-a3e703f2e073d358c | mayker-dev:reviewer | deliver | 5 | 3 | 16 | 8.0 | 2/0/0 | 8.00/n/a/n/a | 4.0K | 44.5K | 58.7K | 0.63 | claude-opus-5-5 |  |
| agent-a4617b2c303878a1d | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 2/1/1 | 4.50/2.00/1.00 | 2.7K | 52.4K | 59.5K | 0.824 | claude-sonnet-5-5 |  |
| agent-a4a6e0c50c52617a4 | mayker-dev:builder | deliver | 5 | 5 | 6 | 1.5 | 0/1/3 | n/a/1.00/1.67 | 1.3K | 42.2K | 44.7K | 0.851 | claude-sonnet-5-5 |  |
| agent-a50571e66d4a179c1 | mayker-dev:builder | deliver | 5 | 9 | 17 | 2.12 | 2/2/4 | 3.00/3.00/1.25 | 5.5K | 64.7K | 72.1K | 0.876 | claude-sonnet-5-5 |  |
| agent-a55de179f31aac351 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 8.00/1.00/1.67 | 5.5K | 52.5K | 58.3K | 0.855 | claude-fable-5-1 |  |
| agent-a589fb41a8fe2ad6a | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 2/2/2 | 4.00/3.50/1.00 | 6.4K | 64.3K | 72.5K | 0.839 | claude-sonnet-5-5 |  |
| agent-a5b0b2c17e4ff6891 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 4.00/4.00/2.67 | 6.8K | 59.8K | 74.3K | 0.828 | claude-fable-5-1 |  |
| agent-a5cf6ef6be2c08879 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 0/0/2 | n/a/n/a/2.00 | 1.3K | 39.2K | 44.8K | 0.732 | claude-sonnet-5-5 |  |
| agent-a605516a782700a40 | mayker-dev:planner | deliver | 5 | 11 | 29 | 2.9 | 0/2/8 | n/a/1.00/3.38 | 14.6K | 94.6K | 112.8K | 0.904 | claude-opus-5-5 |  |
| agent-a67b9cba2aa085034 | mayker-dev:builder | deliver | 5 | 11 | 35 | 3.5 | 2/2/6 | 6.50/8.00/1.00 | 9.7K | 72.6K | 80.6K | 0.916 | claude-sonnet-5-5 |  |
| agent-a68155e7dff43ccf3 | mayker-dev:builder | deliver | 5 | 6 | 6 | 1.2 | 0/0/5 | n/a/n/a/1.20 | 1.5K | 40.1K | 42.2K | 0.88 | claude-sonnet-5-5 |  |
| agent-a6979ae0f4939f050 | mayker-dev:builder | deliver | 5 | 11 | 17 | 1.7 | 2/3/5 | 2.50/1.67/1.40 | 6.9K | 54.9K | 60.6K | 0.922 | claude-sonnet-5-5 |  |
| agent-a78dfce9c091be43e | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/1/5 | 2.50/2.00/1.00 | 5.0K | 54.1K | 59.5K | 0.905 | claude-sonnet-5-5 |  |
| agent-a7e2dfad48145d811 | mayker-dev:planner | deliver | 5 | 14 | 32 | 2.46 | 0/2/11 | n/a/1.50/2.64 | 17.0K | 98.0K | 118.6K | 0.923 | claude-opus-5-5 |  |
| agent-a808e18651c42b65d | mayker-dev:builder | deliver | 5 | 15 | 22 | 1.57 | 1/1/11 | 4.00/3.00/1.27 | 6.3K | 68.5K | 75.9K | 0.939 | claude-sonnet-5-5 |  |
| agent-a8320f90cf306e400 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 1/1/4 | 3.00/1.00/1.75 | 4.1K | 46.9K | 52.7K | 0.878 | claude-fable-5-1 |  |
| agent-a8713960385fac221 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 2.50/1.50/1.20 | 6.6K | 53.0K | 59.9K | 0.912 | claude-sonnet-5-5 |  |
| agent-a873398f5ee49628f | mayker-dev:orchestrator | deliver | 5 | 8 | 16 | 2.29 | 2/1/4 | 5.00/1.00/1.25 | 6.0K | 52.9K | 61.6K | 0.854 | claude-fable-5-1 |  |
| agent-a87570cf783949e29 | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 4.5K | 46.3K | 62.6K | 0.616 | claude-opus-5-5 |  |
| agent-a9d6738e6cc16ef8f | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 4.6K | 52.2K | 66.8K | 0.724 | claude-opus-5-5 |  |
| agent-a9fd36e85ad71ab47 | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 2/1/1 | 5.50/1.00/1.00 | 2.6K | 52.7K | 59.6K | 0.824 | claude-sonnet-5-5 |  |
| agent-aa113990fc8c726b1 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 713 | 37.5K | 39.3K | 0.768 | claude-sonnet-5-5 |  |
| agent-aac1d3dab7091af84 | mayker-dev:builder | deliver | 5 | 9 | 25 | 3.12 | 2/1/5 | 3.50/8.00/2.00 | 6.4K | 69.4K | 78.2K | 0.896 | claude-sonnet-5-5 |  |
| agent-ab24dde267d899331 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 3.00/2.00/2.00 | 4.8K | 47.6K | 55.5K | 0.85 | claude-fable-5-1 |  |
| agent-abe853713b6d4e45b | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 3.00/1.50/1.00 | 6.0K | 64.1K | 70.9K | 0.9 | claude-sonnet-5-5 |  |
| agent-acf978ee9e9c23487 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 9.00/1.00/1.33 | 7.2K | 59.9K | 68.1K | 0.846 | claude-fable-5-1 |  |
| agent-ad710d50fcba8d927 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 3.00/1.50/1.00 | 6.5K | 55.5K | 61.3K | 0.914 | claude-sonnet-5-5 |  |
| agent-adb96f27c22c7877c | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 4.4K | 47.0K | 64.8K | 0.54 | claude-opus-5-5 |  |
| agent-ae473c734b1aae2aa | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 4.00/2.00/1.00 | 5.6K | 50.6K | 55.6K | 0.879 | claude-fable-5-1 |  |
| agent-ae86b77f3a66b18d1 | mayker-dev:orchestrator | deliver | 8 | 5 | 6 | 1.5 | 2/0/2 | 2.00/n/a/1.00 | 9.9K | 55.5K | 65.6K | 0.763 | claude-fable-5-1 |  |
| agent-af181d016af5414ac | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 4.50/10.00/1.00 | 6.5K | 64.8K | 74.9K | 0.842 | claude-sonnet-5-5 |  |
| agent-af5f7722d4925300c | mayker-dev:orchestrator | deliver | 3 | 10 | 20 | 2.22 | 1/3/5 | 4.00/1.33/2.40 | 15.1K | 90.1K | 112.7K | 0.875 | claude-fable-5-1 |  |

**45 dispatch(es)** in `deliver` (mayker-dev:builder 21, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 61.6K, peak 124.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.3K, 40.5K, 42.2K, 44.7K, 44.8K, 52.7K, 53.7K, 55.5K, 55.6K, 57.2K, 57.3K, 58.3K, 58.7K, 59.2K, 59.4K, 59.5K, 59.5K, 59.6K, 59.9K, 60.6K, 60.8K, 61.3K, 61.6K, 62.3K, 62.6K, 62.9K, 64.8K, 65.6K, 66.8K, 68.1K, 70.9K, 72.1K, 72.5K, 74.3K, 74.9K, 75.9K, 78.2K, 80.6K, 99.4K, 106.8K, 109.9K, 112.7K, 112.8K, 118.6K, 124.0K.

**All runs:** 1 run(s), wall 1h02m (sum of per-run walls, idle time between runs excluded), 510 turns, 972 tool calls, 409.4K output tokens, cache hit 0.957.

Turn classes across every bucket, read / edit / exec: 70/66/296 turns, 4.40/2.15/1.71 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 55m24s of round trip (command plus model time, ADR 0006 section 2): 89% of wall.

All runs: CI wait: 15m36s in `ci-poll.sh` calls; framework wall (wall less CI wait) 46m35s.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 3/0/7).
