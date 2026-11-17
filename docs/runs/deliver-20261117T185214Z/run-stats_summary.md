# Run statistics, run

Generated 2026-11-17 19:36 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 47 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 44m14s | 550 | 1123 | 2.34 | 16 | 421.4K |  | 525.5K |  | 0.962 | claude-opus-5-5 | 79/89/266 (exec 73% of wall) | 4.35/2.40/1.78 |  |

Wall is this run's last step end minus its first step start; steps sum to 44m15s.

Exec turns took 32m23s of round trip (command plus model time, ADR 0006 section 2): 73% of wall.

CI wait: 6m10s in `ci-poll.sh` calls; framework wall (wall less CI wait) 38m03s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0c71893ebb2f9b28 | mayker-dev:builder | deliver | 5 | 12 | 27 | 2.45 | 2/3/6 | 4.50/3.67/1.17 | 8.0K | 64.5K | 70.8K | 0.925 | claude-sonnet-5-5 |  |
| agent-a113e78992d8ec7c8 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 4.8K | 43.2K | 58.7K | 0.547 | claude-opus-5-5 |  |
| agent-a270e918838dca131 | mayker-dev:planner | deliver | 5 | 9 | 27 | 3.38 | 2/1/4 | 4.50/2.00/2.50 | 10.8K | 75.4K | 95.8K | 0.859 | claude-opus-5-5 |  |
| agent-a31615458f883fde5 | mayker-dev:planner | deliver | 5 | 10 | 28 | 3.11 | 1/1/7 | 5.00/2.00/3.00 | 13.5K | 75.4K | 95.6K | 0.891 | claude-opus-5-5 |  |
| agent-a3a639bc2b9ad6357 | mayker-dev:orchestrator | deliver | 5 | 7 | 24 | 4.0 | 2/1/3 | 5.00/2.00/4.00 | 7.2K | 57.1K | 68.3K | 0.861 | claude-fable-5-2 |  |
| agent-a3d35f5fef6edc617 | mayker-dev:reviewer | deliver | 5 | 4 | 23 | 7.67 | 3/0/0 | 7.67/n/a/n/a | 8.0K | 53.4K | 70.9K | 0.712 | claude-opus-5-5 |  |
| agent-a3dac057c7199491e | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 1/3/4 | 6.00/2.00/1.00 | 4.0K | 52.8K | 57.2K | 0.907 | claude-sonnet-5-5 |  |
| agent-a3dad96206895fed6 | mayker-dev:builder | deliver | 5 | 8 | 10 | 1.43 | 1/2/4 | 3.00/1.50/1.00 | 6.0K | 52.2K | 57.7K | 0.893 | claude-sonnet-5-5 |  |
| agent-a42bfddbe38f7bc1a | mayker-dev:orchestrator | deliver | 5 | 6 | 20 | 4.0 | 1/1/3 | 3.00/2.00/5.00 | 7.0K | 66.0K | 77.6K | 0.836 | claude-fable-5-2 |  |
| agent-a4896ca2c069c7dce | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 4.00/2.00/1.00 | 2.1K | 48.1K | 52.6K | 0.836 | claude-sonnet-5-5 |  |
| agent-a503b984ede12577f | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 2.8K | 53.2K | 60.0K | 0.853 | claude-sonnet-5-5 |  |
| agent-a53c4ed081bcbbc75 | mayker-dev:reviewer | deliver | 5 | 3 | 21 | 10.5 | 2/0/0 | 10.50/n/a/n/a | 5.6K | 46.9K | 67.4K | 0.52 | claude-opus-5-5 |  |
| agent-a56eb035b1232b9c8 | mayker-dev:planner | deliver | 5 | 14 | 37 | 2.85 | 2/2/8 | 3.50/1.50/2.38 | 16.6K | 86.0K | 106.9K | 0.911 | claude-opus-5-5 |  |
| agent-a56f03e6adbafb3c6 | mayker-dev:builder | deliver | 5 | 8 | 22 | 3.14 | 2/2/3 | 4.50/5.00/1.00 | 7.3K | 63.1K | 70.9K | 0.886 | claude-sonnet-5-5 |  |
| agent-a601c748be3fd132a | mayker-dev:builder | deliver | 5 | 17 | 28 | 1.75 | 3/1/11 | 2.33/3.00/1.55 | 6.3K | 64.2K | 71.1K | 0.947 | claude-sonnet-5-5 |  |
| agent-a6083da7f30d171be | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 927 | 42.4K | 51.3K | 0.699 | claude-sonnet-5-5 |  |
| agent-a69df592730299159 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 5.8K | 48.6K | 62.3K | 0.728 | claude-opus-5-5 |  |
| agent-a71d27eb1d8ff0f3e | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 1/4/3 | 5.00/1.50/1.00 | 4.0K | 54.5K | 58.9K | 0.907 | claude-sonnet-5-5 |  |
| agent-a72aa9559657f3df2 | mayker-dev:builder | deliver | 5 | 5 | 6 | 1.5 | 1/1/2 | 2.00/1.00/1.50 | 1.7K | 46.6K | 52.7K | 0.83 | claude-sonnet-5-5 |  |
| agent-a796b9f641ad0396d | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 3.8K | 47.0K | 51.9K | 0.779 | claude-fable-5-2 |  |
| agent-a7bc0e8cf29a227ad | mayker-dev:builder | deliver | 5 | 11 | 18 | 1.8 | 1/1/8 | 3.00/3.00/1.50 | 4.7K | 53.5K | 58.1K | 0.923 | claude-sonnet-5-5 |  |
| agent-a7f2416a75af6e2e1 | mayker-dev:orchestrator | deliver | 5 | 4 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 2.9K | 45.3K | 50.1K | 0.794 | claude-fable-5-2 |  |
| agent-a81f29ee357ae8b2d | mayker-dev:builder | deliver | 5 | 15 | 32 | 2.29 | 2/1/10 | 3.00/2.00/2.30 | 7.6K | 65.8K | 74.1K | 0.938 | claude-sonnet-5-5 |  |
| agent-a88def5a1e8e7ac6d | mayker-dev:orchestrator | deliver | 5 | 9 | 20 | 2.5 | 1/3/3 | 6.00/2.00/2.33 | 6.7K | 69.1K | 80.6K | 0.87 | claude-fable-5-2 |  |
| agent-a88f6f4d593472ef8 | mayker-dev:builder | deliver | 5 | 5 | 30 | 7.5 | 2/1/1 | 6.50/16.00/1.00 | 9.0K | 60.1K | 73.6K | 0.755 | claude-sonnet-5-5 |  |
| agent-a899480b89d7a40de | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 2.00/n/a/1.00 | 833 | 40.8K | 46.9K | 0.724 | claude-sonnet-5-5 |  |
| agent-a8a5fa0562376bd0d | mayker-dev:planner | deliver | 5 | 15 | 39 | 2.79 | 2/2/9 | 3.00/1.00/2.56 | 21.7K | 89.9K | 112.2K | 0.926 | claude-opus-5-5 |  |
| agent-a95204bfed584add3 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/2/2 | 6.00/2.50/1.50 | 4.1K | 55.6K | 63.2K | 0.849 | claude-fable-5-2 |  |
| agent-aa2c3b35eb8c4fb00 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 3.00/1.50/1.00 | 6.1K | 54.7K | 61.1K | 0.912 | claude-sonnet-5-5 |  |
| agent-aa437c71af9dd93e5 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 4.50/9.00/1.50 | 6.9K | 58.6K | 68.0K | 0.806 | claude-sonnet-5-5 |  |
| agent-aaa1dd2e374cc907f | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 2/2/4 | 3.00/1.50/1.50 | 6.5K | 58.7K | 67.2K | 0.898 | claude-sonnet-5-5 |  |
| agent-ab15674a1d150b809 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 6.00/4.00/1.25 | 3.9K | 49.7K | 55.1K | 0.878 | claude-fable-5-2 |  |
| agent-ab1de15bd26e3d015 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 2.50/1.50/1.25 | 5.2K | 52.9K | 58.7K | 0.904 | claude-sonnet-5-5 |  |
| agent-ab9806db3a7f1796d | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 5.3K | 44.4K | 61.1K | 0.611 | claude-opus-5-5 |  |
| agent-abd135655e3266d68 | mayker-dev:planner | deliver | 5 | 11 | 28 | 2.8 | 2/1/6 | 3.50/2.00/2.17 | 13.3K | 76.1K | 94.6K | 0.903 | claude-opus-5-5 |  |
| agent-ac79dd8332c889ee8 | mayker-dev:orchestrator | deliver | 5 | 8 | 27 | 3.86 | 2/1/3 | 5.00/2.00/3.33 | 6.6K | 66.5K | 77.8K | 0.854 | claude-fable-5-2 |  |
| agent-ac7bd4f79faf52d28 | mayker-dev:orchestrator | deliver | 8 | 4 | 9 | 3.0 | 1/0/2 | 6.00/n/a/1.50 | 8.1K | 55.8K | 64.2K | 0.775 | claude-fable-5-2 |  |
| agent-acb4ca5ef27936160 | mayker-dev:orchestrator | deliver | 3 | 11 | 24 | 2.4 | 2/3/5 | 2.50/2.00/2.60 | 11.2K | 91.4K | 110.8K | 0.89 | claude-fable-5-2 |  |
| agent-acb8114fa731c4996 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 2.00/n/a/1.00 | 825 | 38.6K | 41.9K | 0.751 | claude-sonnet-5-5 |  |
| agent-ace8fdf9402992cce | mayker-dev:builder | deliver | 5 | 9 | 17 | 2.12 | 2/2/4 | 2.00/3.50/1.50 | 7.5K | 57.8K | 64.5K | 0.901 | claude-sonnet-5-5 |  |
| agent-ad67cc2dc20c22b3b | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 2.7K | 44.9K | 50.0K | 0.777 | claude-fable-5-2 |  |
| agent-adc77801bfadfeed6 | mayker-dev:orchestrator | deliver | 5 | 9 | 28 | 3.5 | 1/2/5 | 4.00/4.00/3.20 | 9.6K | 84.4K | 103.4K | 0.881 | claude-fable-5-2 |  |
| agent-aeb671875a87c8185 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 1/2/3 | 5.00/3.00/1.00 | 4.7K | 52.5K | 58.3K | 0.877 | claude-sonnet-5-5 |  |
| agent-aef8af3caecd9a0b7 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 0/1/4 | n/a/2.00/3.50 | 5.1K | 60.6K | 69.9K | 0.843 | claude-fable-5-2 |  |
| agent-af077b819ca678ad5 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 0/1/5 | n/a/2.00/3.00 | 4.9K | 53.4K | 60.4K | 0.873 | claude-fable-5-2 |  |
| agent-af55a74d013d560fb | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.0K | 44.5K | 54.6K | 0.689 | claude-sonnet-5-5 |  |
| agent-af8a06e631d409e08 | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 2/1/1 | 5.00/2.00/1.00 | 2.8K | 53.9K | 61.2K | 0.822 | claude-sonnet-5-5 |  |

**47 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 63.2K, peak 112.2K, 0 above the auto threshold (80% of the serving model's window). Distribution: 41.9K, 46.9K, 50.0K, 50.1K, 51.3K, 51.9K, 52.6K, 52.7K, 54.6K, 55.1K, 57.2K, 57.7K, 58.1K, 58.3K, 58.7K, 58.7K, 58.9K, 60.0K, 60.4K, 61.1K, 61.1K, 61.2K, 62.3K, 63.2K, 64.2K, 64.5K, 67.2K, 67.4K, 68.0K, 68.3K, 69.9K, 70.8K, 70.9K, 70.9K, 71.1K, 73.6K, 74.1K, 77.6K, 77.8K, 80.6K, 94.6K, 95.6K, 95.8K, 103.4K, 106.9K, 110.8K, 112.2K.

**All runs:** 1 run(s), wall 44m14s (sum of per-run walls, idle time between runs excluded), 550 turns, 1123 tool calls, 421.4K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 79/89/266 turns, 4.35/2.40/1.78 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 32m23s of round trip (command plus model time, ADR 0006 section 2): 73% of wall.

All runs: CI wait: 6m10s in `ci-poll.sh` calls; framework wall (wall less CI wait) 38m03s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
