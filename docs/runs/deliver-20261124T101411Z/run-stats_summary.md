# Run statistics, run

Generated 2026-11-24 10:56 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 42m41s | 569 | 1161 | 2.32 | 15 | 431.1K |  | 557.0K |  | 0.964 | claude-opus-5-5 | 104/89/266 (exec 74% of wall) | 3.70/2.31/1.85 |  |

Wall is this run's last step end minus its first step start; steps sum to 42m41s.

Exec turns took 31m40s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

CI wait: 6m06s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m34s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a039f3d901be7e52b | mayker-dev:orchestrator | deliver | 3 | 11 | 22 | 2.2 | 1/3/6 | 4.00/1.67/2.17 | 11.5K | 91.1K | 107.1K | 0.893 | claude-fable-5-2 |  |
| agent-a03c2dc0533ab9a32 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/2/2 | 5.00/5.50/1.00 | 8.3K | 61.8K | 72.3K | 0.865 | claude-sonnet-5-5 |  |
| agent-a0fad3a367ff5f3a8 | mayker-dev:builder | deliver | 5 | 10 | 25 | 2.78 | 3/2/4 | 2.67/5.00/1.75 | 7.9K | 63.3K | 73.0K | 0.907 | claude-sonnet-5-5 |  |
| agent-a184638688964535d | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.4K | 48.5K | 53.5K | 0.724 | claude-fable-5-2 |  |
| agent-a1ba70c60643a9705 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 0/2/5 | n/a/1.00/1.80 | 2.9K | 51.2K | 55.0K | 0.899 | claude-sonnet-5-5 |  |
| agent-a1e181466a70098a1 | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.3K | 48.1K | 52.9K | 0.805 | claude-fable-5-2 |  |
| agent-a1f707d0f7f773126 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 3/2/4 | 1.67/1.50/1.50 | 6.7K | 55.2K | 62.5K | 0.912 | claude-sonnet-5-5 |  |
| agent-a224077bc7f96b257 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/2/2 | 5.00/5.50/1.00 | 7.6K | 60.0K | 69.8K | 0.867 | claude-sonnet-5-5 |  |
| agent-a28808beb7a0c5472 | mayker-dev:reviewer | deliver | 5 | 4 | 24 | 8.0 | 3/0/0 | 8.00/n/a/n/a | 6.6K | 54.4K | 73.7K | 0.707 | claude-opus-5-5 |  |
| agent-a2950a3b407ec03ca | mayker-dev:builder | deliver | 5 | 6 | 6 | 1.2 | 2/1/2 | 1.50/1.00/1.00 | 1.1K | 40.6K | 43.1K | 0.88 | claude-sonnet-5-5 |  |
| agent-a299eb5c9312d378c | mayker-dev:orchestrator | deliver | 5 | 6 | 22 | 4.4 | 2/1/2 | 5.00/2.00/5.00 | 6.2K | 53.3K | 62.2K | 0.806 | claude-fable-5-2 |  |
| agent-a2b3b1d214f41f079 | mayker-dev:builder | deliver | 5 | 7 | 34 | 5.67 | 2/2/2 | 8.00/7.00/2.00 | 10.1K | 63.1K | 75.6K | 0.829 | claude-sonnet-5-5 |  |
| agent-a2b932e2adba42bb1 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.6K | 49.3K | 62.8K | 0.681 | claude-opus-5-5 |  |
| agent-a3c736d1c3b0bde9c | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 2/1/5 | 2.50/3.00/1.40 | 5.1K | 52.7K | 60.2K | 0.902 | claude-sonnet-5-5 |  |
| agent-a3d30b44a2b32475b | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 1/1/2 | 8.00/2.00/1.50 | 4.9K | 55.7K | 61.7K | 0.779 | claude-fable-5-2 |  |
| agent-a45ec436a772de15f | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 0/1/4 | n/a/2.00/3.75 | 5.6K | 48.9K | 55.6K | 0.856 | claude-fable-5-2 |  |
| agent-a470d0468b949fe38 | mayker-dev:planner | deliver | 5 | 14 | 38 | 2.92 | 2/1/10 | 3.50/2.00/2.90 | 17.4K | 90.9K | 117.7K | 0.918 | claude-opus-5-5 |  |
| agent-a5843d6c6f093fab2 | mayker-dev:planner | deliver | 5 | 19 | 42 | 2.33 | 4/2/11 | 2.50/1.50/2.09 | 16.9K | 95.9K | 117.2K | 0.936 | claude-opus-5-5 |  |
| agent-a5c1bb0e789ecc9cf | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 3/1/2 | 3.00/2.00/2.50 | 5.0K | 52.4K | 61.4K | 0.869 | claude-fable-5-2 |  |
| agent-a5fc83c72c77cc5f0 | mayker-dev:orchestrator | deliver | 5 | 9 | 21 | 2.62 | 1/3/3 | 5.00/2.00/2.67 | 9.3K | 77.1K | 93.6K | 0.887 | claude-fable-5-2 |  |
| agent-a62ff1f1cca4da562 | mayker-dev:planner | deliver | 5 | 13 | 40 | 3.33 | 1/2/8 | 1.00/1.50/3.50 | 17.6K | 87.9K | 116.2K | 0.898 | claude-opus-5-5 |  |
| agent-a630bbca202418578 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 562 | 40.0K | 47.3K | 0.722 | claude-sonnet-5-5 |  |
| agent-a655a3348f5924453 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 6.00/1.00/1.00 | 3.3K | 56.4K | 62.7K | 0.876 | claude-sonnet-5-5 |  |
| agent-a7ba3d62fc9866bdc | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 3.00/5.00/1.00 | 5.0K | 52.6K | 60.8K | 0.851 | claude-sonnet-5-5 |  |
| agent-a7edcb2a805618969 | mayker-dev:builder | deliver | 5 | 14 | 23 | 1.77 | 3/1/8 | 2.67/2.00/1.50 | 5.4K | 61.8K | 67.4K | 0.938 | claude-sonnet-5-5 |  |
| agent-a80a7f9f15cff6078 | mayker-dev:orchestrator | deliver | 8 | 5 | 10 | 2.5 | 2/0/2 | 3.50/n/a/1.50 | 8.5K | 57.8K | 65.7K | 0.826 | claude-fable-5-2 |  |
| agent-a818a3af5e7e2d3fe | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 466 | 36.2K | 39.0K | 0.652 | claude-sonnet-5-5 |  |
| agent-a89b12e945edcdb5c | mayker-dev:builder | deliver | 5 | 2 | 1 | 1.0 | 1/0/0 | 1.00/n/a/n/a | 484 | 36.1K | 38.9K | 0.654 | claude-sonnet-5-5 |  |
| agent-a8e2ae6c2eed0ba43 | mayker-dev:builder | deliver | 5 | 8 | 21 | 3.0 | 2/2/3 | 4.00/5.00/1.00 | 6.3K | 60.0K | 68.5K | 0.857 | claude-sonnet-5-5 |  |
| agent-a921f599a802442fc | mayker-dev:planner | deliver | 5 | 17 | 45 | 2.81 | 2/4/9 | 2.00/1.50/3.11 | 16.8K | 90.4K | 116.2K | 0.933 | claude-opus-5-5 |  |
| agent-a9251235510af1d13 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 596 | 39.8K | 46.9K | 0.723 | claude-sonnet-5-5 |  |
| agent-a9cc4c30425dd9a6f | mayker-dev:reviewer | deliver | 5 | 4 | 23 | 7.67 | 3/0/0 | 7.67/n/a/n/a | 8.1K | 53.1K | 70.2K | 0.717 | claude-opus-5-5 |  |
| agent-a9d9fe571c91d1662 | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 2/1/5 | 3.00/2.00/1.60 | 6.1K | 62.2K | 71.5K | 0.897 | claude-sonnet-5-5 |  |
| agent-aa3c4689315fa2d25 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/1/4 | 5.50/1.00/1.25 | 3.8K | 54.5K | 59.8K | 0.895 | claude-sonnet-5-5 |  |
| agent-aa7b93f2236be5aa1 | mayker-dev:reviewer | deliver | 5 | 4 | 16 | 5.33 | 3/0/0 | 5.33/n/a/n/a | 6.8K | 49.7K | 64.5K | 0.676 | claude-opus-5-5 |  |
| agent-aa804cd40d6250ace | mayker-dev:reviewer | deliver | 5 | 5 | 22 | 5.5 | 4/0/0 | 5.50/n/a/n/a | 6.9K | 53.6K | 66.5K | 0.789 | claude-opus-5-5 |  |
| agent-ab0b4ef22ec110c08 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 2/1/3 | 4.00/1.00/1.00 | 2.5K | 55.5K | 61.1K | 0.878 | claude-sonnet-5-5 |  |
| agent-ab30b6d6e57ec3449 | mayker-dev:builder | deliver | 5 | 14 | 27 | 2.08 | 2/1/10 | 4.00/2.00/1.70 | 7.0K | 62.7K | 70.7K | 0.935 | claude-sonnet-5-5 |  |
| agent-aba2740b0de6cfdef | mayker-dev:planner | deliver | 5 | 15 | 45 | 3.21 | 2/2/10 | 4.00/1.50/3.40 | 19.9K | 91.5K | 114.7K | 0.926 | claude-opus-5-5 |  |
| agent-abc9eff8d5c9ca9bb | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 5.00/2.00/2.00 | 5.3K | 52.2K | 60.3K | 0.85 | claude-fable-5-2 |  |
| agent-ac84ac72e8ec5e351 | mayker-dev:builder | deliver | 5 | 12 | 14 | 1.27 | 3/3/5 | 1.33/1.33/1.20 | 7.5K | 50.1K | 56.1K | 0.93 | claude-sonnet-5-5 |  |
| agent-ae3341049600270dd | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 2.7K | 46.3K | 50.7K | 0.818 | claude-fable-5-2 |  |
| agent-aea967c85aa7ba7f7 | mayker-dev:orchestrator | deliver | 5 | 9 | 23 | 2.88 | 3/2/3 | 3.00/2.00/3.33 | 8.5K | 65.9K | 82.7K | 0.86 | claude-fable-5-2 |  |
| agent-aef9361f7cf6ac68f | mayker-dev:orchestrator | deliver | 5 | 12 | 25 | 2.27 | 1/2/7 | 6.00/2.00/2.00 | 7.3K | 85.2K | 97.1K | 0.92 | claude-fable-5-2 |  |
| agent-af0d247f77c975140 | mayker-dev:builder | deliver | 5 | 8 | 18 | 2.57 | 1/1/5 | 4.00/3.00/2.20 | 4.9K | 60.4K | 68.9K | 0.886 | claude-sonnet-5-5 |  |
| agent-afca7bca81b2b2604 | mayker-dev:builder | deliver | 5 | 12 | 27 | 2.45 | 2/5/4 | 4.00/3.00/1.00 | 6.8K | 59.9K | 65.5K | 0.928 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 65.0K, peak 117.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.9K, 39.0K, 43.1K, 46.9K, 47.3K, 50.7K, 52.9K, 53.5K, 55.0K, 55.6K, 56.1K, 59.8K, 60.2K, 60.3K, 60.8K, 61.1K, 61.4K, 61.7K, 62.2K, 62.5K, 62.7K, 62.8K, 64.5K, 65.5K, 65.7K, 66.5K, 67.4K, 68.5K, 68.9K, 69.8K, 70.2K, 70.7K, 71.5K, 72.3K, 73.0K, 73.7K, 75.6K, 82.7K, 93.6K, 97.1K, 107.1K, 114.7K, 116.2K, 116.2K, 117.2K, 117.7K.

**All runs:** 1 run(s), wall 42m41s (sum of per-run walls, idle time between runs excluded), 569 turns, 1161 tool calls, 431.1K output tokens, cache hit 0.964.

Turn classes across every bucket, read / edit / exec: 104/89/266 turns, 3.70/2.31/1.85 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 31m40s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

All runs: CI wait: 6m06s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m34s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
