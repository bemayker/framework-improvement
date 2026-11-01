# Run statistics, run

Generated 2026-11-01 06:13 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 39 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 2m55s | 10 | 31 | 3.44 | 11 | 14.7K | 79.6K | 100.5K | 0 | 0.869 | claude-fable-5-1 | 1/3/4 | 4.00/2.00/5.00 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 2m55s | 10 | 31 | 3.44 | 11 | 14.7K | 79.6K | 100.5K | 0 | 0.869 | claude-fable-5-1 | 1/3/4 | 4.00/2.00/5.00 |  |
| 5 | Scheduler loop | 40m33s | 453 | 855 | 2.16 | 14 | 332.0K | 136.1K | 415.3K | 0 | 0.958 | claude-opus-5-5 | 73/57/234 | 3.82/2.16/1.72 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at wave boundary | 1m52s | 12 | 22 | 2.0 | 5 | 9.6K | 162.5K | 347.6K | 0 | 0.949 | claude-fable-5-1 | 2/1/6 | 3.00/2.00/2.00 |  |
| 8 | Final report | 3m14s | 6 | 10 | 2.0 | 4 | 20.6K | 178.4K | 428.4K | 0 | 0.925 | claude-fable-5-1 | 0/1/3 | n/a/2.00/2.33 |  |
| **run total** |  | 46m42s | 469 | 896 | 2.19 | 14 | 367.3K |  | 428.4K |  | 0.957 | claude-opus-5-5 | 74/61/241 (exec 70% of wall) | 3.82/2.15/1.78 |  |

Wall is this run's last step end minus its first step start; steps sum to 46m42s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 32m41s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

CI wait: 5m14s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m28s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a02d324573325e1cb | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 4.00/1.00/2.25 | 3.0K | 55.4K | 61.7K | 0.875 | claude-sonnet-5-5 |  |
| agent-a0705faf71cf00ebd | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 6.0K | 55.7K | 78.0K | 0.65 | claude-opus-5-5 |  |
| agent-a2457140050cd755a | mayker-dev:builder | deliver | 5 | 16 | 19 | 1.27 | 3/3/9 | 1.33/1.67/1.11 | 7.6K | 49.0K | 54.3K | 0.948 | claude-sonnet-5-5 |  |
| agent-a27c4c67f6dff7f5f | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 4.2K | 47.6K | 53.4K | 0.813 | claude-fable-5-1 |  |
| agent-a29de1b2a42af3975 | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 1/1/5 | 5.00/2.00/2.20 | 8.1K | 73.3K | 87.4K | 0.851 | claude-fable-5-1 |  |
| agent-a2d093163caeac256 | mayker-dev:planner | deliver | 5 | 12 | 27 | 2.45 | 1/2/7 | 8.00/1.50/2.14 | 11.2K | 93.6K | 107.9K | 0.915 | claude-opus-5-5 |  |
| agent-a33bee588befca913 | mayker-dev:builder | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 2.00/1.00/2.00 | 1.9K | 52.6K | 59.5K | 0.854 | claude-sonnet-5-5 |  |
| agent-a3545b49332097c84 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.00/3.00/1.25 | 6.0K | 54.3K | 61.8K | 0.888 | claude-sonnet-5-5 |  |
| agent-a478d12232f1725ea | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 1/2/2 | 5.00/3.00/1.00 | 4.5K | 54.4K | 60.6K | 0.855 | claude-sonnet-5-5 |  |
| agent-a4a010c476b139ba0 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 3/1/2 | 2.67/1.00/1.00 | 3.4K | 49.6K | 54.8K | 0.879 | claude-fable-5-1 |  |
| agent-a4b0e43e4caa778d1 | mayker-dev:builder | deliver | 5 | 11 | 19 | 1.9 | 1/0/8 | 2.00/n/a/2.00 | 3.4K | 50.0K | 55.0K | 0.924 | claude-sonnet-5-5 |  |
| agent-a4da8f962e8c5b8e2 | mayker-dev:orchestrator | deliver | 3 | 8 | 28 | 4.0 | 1/2/4 | 4.00/2.00/5.00 | 13.2K | 80.1K | 100.5K | 0.843 | claude-fable-5-1 |  |
| agent-a5bc2468b2c873815 | mayker-dev:planner | deliver | 5 | 13 | 38 | 3.17 | 1/2/9 | 5.00/1.50/3.33 | 22.4K | 102.8K | 129.3K | 0.913 | claude-opus-5-5 |  |
| agent-a619f32fb8ad4bf48 | mayker-dev:builder | deliver | 5 | 11 | 14 | 1.4 | 3/2/5 | 1.67/1.50/1.20 | 6.8K | 57.8K | 65.1K | 0.918 | claude-sonnet-5-5 |  |
| agent-a69388a67fbbe5300 | mayker-dev:builder | deliver | 5 | 16 | 29 | 1.93 | 2/1/11 | 2.50/2.00/1.91 | 7.9K | 70.8K | 81.5K | 0.94 | claude-sonnet-5-5 |  |
| agent-a69c2f10ca4e6a515 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 891 | 40.3K | 48.4K | 0.71 | claude-sonnet-5-5 |  |
| agent-a6e33d091f233254b | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 7.00/1.00/1.67 | 6.9K | 49.4K | 55.1K | 0.814 | claude-fable-5-1 |  |
| agent-a6eda40944f778c9d | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 4.00/1.00/1.00 | 3.4K | 48.0K | 52.9K | 0.816 | claude-fable-5-1 |  |
| agent-a772c38171f045257 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 0/1/3 | n/a/1.00/2.00 | 2.0K | 41.0K | 44.5K | 0.848 | claude-sonnet-5-5 |  |
| agent-a7a35894878c3559f | mayker-dev:builder | deliver | 5 | 12 | 29 | 2.64 | 1/1/8 | 2.00/3.00/2.88 | 5.9K | 59.3K | 66.7K | 0.925 | claude-sonnet-5-5 |  |
| agent-a7c2fada6df662b3f | mayker-dev:reviewer | deliver | 5 | 5 | 21 | 5.25 | 4/0/0 | 5.25/n/a/n/a | 7.0K | 56.5K | 70.2K | 0.752 | claude-opus-5-5 |  |
| agent-a7c78fcfff091c944 | mayker-dev:builder | deliver | 5 | 8 | 32 | 4.57 | 2/2/3 | 6.50/8.00/1.00 | 8.4K | 68.9K | 79.9K | 0.855 | claude-sonnet-5-5 |  |
| agent-a8c526894963de2fd | mayker-dev:orchestrator | deliver | 5 | 7 | 10 | 2.0 | 1/1/3 | 5.00/1.00/1.33 | 4.9K | 49.6K | 54.8K | 0.879 | claude-fable-5-1 |  |
| agent-a8d398d1331e76773 | mayker-dev:builder | deliver | 5 | 8 | 23 | 3.29 | 3/1/3 | 3.33/10.00/1.00 | 8.3K | 68.6K | 79.7K | 0.879 | claude-sonnet-5-5 |  |
| agent-a9bbd5395e418ba96 | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 2/1/1 | 5.00/1.00/1.00 | 2.8K | 53.6K | 61.3K | 0.821 | claude-sonnet-5-5 |  |
| agent-a9f2384d498b082c3 | mayker-dev:builder | deliver | 5 | 3 | 2 | 1.0 | 1/0/1 | 1.00/n/a/1.00 | 538 | 37.0K | 38.7K | 0.771 | claude-sonnet-5-5 |  |
| agent-a9fa764302a952dab | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 8.00/2.00/1.00 | 6.4K | 54.8K | 60.7K | 0.854 | claude-fable-5-1 |  |
| agent-aacf9b1d7722c8294 | mayker-dev:planner | deliver | 5 | 11 | 33 | 3.3 | 1/2/6 | 9.00/2.00/3.00 | 14.6K | 99.4K | 123.2K | 0.887 | claude-opus-5-5 |  |
| agent-ab55f8a8d9b85a748 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.00/3.00/1.25 | 6.0K | 54.5K | 62.0K | 0.888 | claude-sonnet-5-5 |  |
| agent-acf51ecfe132f4283 | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 2/1/7 | 4.00/2.00/2.43 | 16.6K | 105.2K | 130.8K | 0.896 | claude-opus-5-5 |  |
| agent-ad26c11b2dcc50a28 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 4.50/4.50/1.00 | 6.8K | 56.9K | 66.3K | 0.834 | claude-sonnet-5-5 |  |
| agent-ad8f728e572a4a681 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/3/2 | 3.00/1.00/1.00 | 4.6K | 53.1K | 57.9K | 0.895 | claude-sonnet-5-5 |  |
| agent-ade4e14692887f9d8 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 3/1/2 | 3.00/1.00/3.50 | 4.6K | 51.7K | 57.2K | 0.877 | claude-fable-5-1 |  |
| agent-ae7a556b2d11f471c | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.4K | 49.3K | 68.8K | 0.597 | claude-opus-5-5 |  |
| agent-aef0dd04d7c0ce9b6 | mayker-dev:orchestrator | deliver | 5 | 8 | 19 | 2.71 | 1/2/4 | 7.00/1.50/2.25 | 7.7K | 55.9K | 62.9K | 0.859 | claude-fable-5-1 |  |
| agent-af3601436873f72f5 | mayker-dev:orchestrator | deliver | 8 | 4 | 7 | 2.33 | 0/0/3 | n/a/n/a/2.33 | 11.8K | 55.8K | 66.8K | 0.701 | claude-fable-5-1 |  |
| agent-af6f076e0bb3e5633 | mayker-dev:builder | deliver | 5 | 9 | 20 | 2.5 | 2/3/3 | 6.00/1.67/1.00 | 4.0K | 57.0K | 61.8K | 0.905 | claude-sonnet-5-5 |  |
| agent-afb1660755a1fa72e | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.7K | 44.9K | 59.9K | 0.624 | claude-opus-5-5 |  |
| agent-afda1aa18b7a3b29d | mayker-dev:builder | deliver | 5 | 10 | 23 | 2.56 | 2/2/5 | 2.00/2.00/3.00 | 8.6K | 69.4K | 82.6K | 0.9 | claude-sonnet-5-5 |  |

**39 dispatch(es)** in `deliver` (mayker-dev:builder 20, mayker-dev:orchestrator 11, mayker-dev:planner 4, mayker-dev:reviewer 4): median ctx max 61.8K, peak 130.8K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.7K, 44.5K, 48.4K, 52.9K, 53.4K, 54.3K, 54.8K, 54.8K, 55.0K, 55.1K, 57.2K, 57.9K, 59.5K, 59.9K, 60.6K, 60.7K, 61.3K, 61.7K, 61.8K, 61.8K, 62.0K, 62.9K, 65.1K, 66.3K, 66.7K, 66.8K, 68.8K, 70.2K, 78.0K, 79.7K, 79.9K, 81.5K, 82.6K, 87.4K, 100.5K, 107.9K, 123.2K, 129.3K, 130.8K.

**All runs:** 1 run(s), wall 46m42s (sum of per-run walls, idle time between runs excluded), 469 turns, 896 tool calls, 367.3K output tokens, cache hit 0.957.

Turn classes across every bucket, read / edit / exec: 74/61/241 turns, 3.82/2.15/1.78 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 32m41s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

All runs: CI wait: 5m14s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m28s.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/8).
