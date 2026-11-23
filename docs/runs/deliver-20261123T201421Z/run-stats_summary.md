# Run statistics, run

Generated 2026-11-23 20:55 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 50 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 41m44s | 576 | 1257 | 2.5 | 15 | 460.2K |  | 573.3K |  | 0.961 | claude-opus-5-5 | 96/79/281 (exec 80% of wall) | 3.93/2.41/2.12 |  |

Wall is this run's last step end minus its first step start; steps sum to 41m43s.

Exec turns took 33m30s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

CI wait: 6m30s in `ci-poll.sh` calls; framework wall (wall less CI wait) 35m14s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a05edba2cea75a986 | mayker-dev:builder | deliver | 5 | 7 | 18 | 3.0 | 2/2/2 | 6.00/2.00/1.00 | 4.2K | 57.9K | 64.0K | 0.876 | claude-sonnet-5-5 |  |
| agent-a0dc085fbb69d4317 | mayker-dev:orchestrator | deliver | 5 | 8 | 21 | 3.0 | 3/1/3 | 3.67/1.00/3.00 | 5.6K | 59.1K | 68.9K | 0.854 | claude-fable-5-2 |  |
| agent-a12bf3ac44402f7a5 | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.75 | 1/1/2 | 5.00/2.00/2.00 | 3.2K | 45.5K | 51.3K | 0.833 | claude-fable-5-2 |  |
| agent-a1a180d8344767658 | mayker-dev:reviewer | deliver | 5 | 5 | 25 | 6.25 | 4/0/0 | 6.25/n/a/n/a | 7.9K | 61.6K | 82.4K | 0.765 | claude-opus-5-5 |  |
| agent-a1b0a2a691b513ab4 | mayker-dev:orchestrator | deliver | 5 | 9 | 18 | 2.25 | 1/3/3 | 5.00/1.33/2.33 | 7.3K | 74.4K | 88.6K | 0.888 | claude-fable-5-2 |  |
| agent-a24302dbf92ba86bb | mayker-dev:reviewer | deliver | 5 | 5 | 20 | 5.0 | 4/0/0 | 5.00/n/a/n/a | 6.8K | 54.6K | 68.8K | 0.748 | claude-opus-5-5 |  |
| agent-a2a3556bfda0d92e3 | mayker-dev:reviewer | deliver | 5 | 5 | 22 | 5.5 | 4/0/0 | 5.50/n/a/n/a | 6.2K | 50.7K | 61.1K | 0.759 | claude-opus-5-5 |  |
| agent-a33858f1600ecdec1 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 4.00/2.00/2.00 | 3.3K | 48.4K | 55.3K | 0.827 | claude-fable-5-2 |  |
| agent-a3694aef14f004764 | mayker-dev:builder | deliver | 5 | 17 | 35 | 2.19 | 4/1/10 | 3.00/2.00/2.00 | 8.6K | 78.9K | 88.2K | 0.944 | claude-sonnet-5-5 |  |
| agent-a40c6fcd65839e7df | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/1/4 | 4.00/2.00/1.25 | 5.6K | 64.9K | 74.0K | 0.884 | claude-sonnet-5-5 |  |
| agent-a44e7f8bacc7779b0 | mayker-dev:builder | deliver | 5 | 8 | 26 | 3.71 | 1/2/4 | 5.00/5.00/2.75 | 7.8K | 61.6K | 69.8K | 0.858 | claude-sonnet-5-5 |  |
| agent-a4eb1e73e3bd19c03 | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 1/1/2 | 8.00/2.00/2.00 | 4.1K | 47.6K | 53.0K | 0.834 | claude-fable-5-2 |  |
| agent-a565044ce9a69ada2 | mayker-dev:builder | deliver | 5 | 6 | 24 | 4.8 | 2/1/2 | 5.50/11.00/1.00 | 7.4K | 60.3K | 71.7K | 0.84 | claude-sonnet-5-5 |  |
| agent-a60586a844f974982 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 6.00/2.00/1.00 | 3.1K | 47.8K | 52.4K | 0.837 | claude-fable-5-2 |  |
| agent-a6a107a3cca559d8a | mayker-dev:orchestrator | deliver | 5 | 10 | 33 | 3.67 | 1/3/5 | 4.00/3.33/3.80 | 11.5K | 100.3K | 122.7K | 0.891 | claude-fable-5-2 |  |
| agent-a6b00f6990141f6a7 | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 2/1/7 | 5.50/2.00/2.43 | 16.2K | 80.7K | 105.6K | 0.891 | claude-opus-5-5 |  |
| agent-a6cf4c9910eded789 | mayker-dev:planner | deliver | 5 | 11 | 32 | 3.2 | 1/1/7 | 2.00/2.00/3.43 | 14.1K | 82.1K | 105.0K | 0.899 | claude-opus-5-5 |  |
| agent-a6f832d2871873729 | mayker-dev:orchestrator | deliver | 8 | 3 | 10 | 5.0 | 0/0/2 | n/a/n/a/5.00 | 8.1K | 56.0K | 67.1K | 0.6 | claude-fable-5-2 |  |
| agent-a6f8d09bd37268651 | mayker-dev:planner | deliver | 5 | 8 | 17 | 2.43 | 1/2/4 | 6.00/1.50/2.00 | 11.1K | 58.2K | 68.3K | 0.883 | claude-opus-5-5 |  |
| agent-a704830c96112c224 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 3/1/2 | 3.33/2.00/2.50 | 5.4K | 53.3K | 62.0K | 0.87 | claude-fable-5-2 |  |
| agent-a7e7e4475174fb28c | mayker-dev:planner | deliver | 5 | 11 | 35 | 3.5 | 0/1/9 | n/a/2.00/3.67 | 12.1K | 79.1K | 102.1K | 0.898 | claude-opus-5-5 |  |
| agent-a8943f182f4054e72 | mayker-dev:builder | deliver | 5 | 8 | 25 | 3.57 | 2/2/3 | 3.50/5.50/2.33 | 10.0K | 64.4K | 76.0K | 0.879 | claude-sonnet-5-5 |  |
| agent-a8af03438d3effaa9 | mayker-dev:builder | deliver | 5 | 10 | 20 | 2.22 | 2/2/5 | 3.50/1.00/2.20 | 6.2K | 67.0K | 75.8K | 0.907 | claude-sonnet-5-5 |  |
| agent-a9293fea5c8161f3c | mayker-dev:orchestrator | deliver | 3 | 9 | 28 | 3.5 | 1/4/3 | 4.00/2.75/4.33 | 10.6K | 84.3K | 103.6K | 0.863 | claude-fable-5-2 |  |
| agent-a9537ff33f7761da7 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 2.9K | 45.3K | 50.5K | 0.777 | claude-fable-5-2 |  |
| agent-a997250c7a58d5f44 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 1/1/5 | 4.00/2.00/1.40 | 6.1K | 58.6K | 66.1K | 0.889 | claude-sonnet-5-5 |  |
| agent-a9add8207ad57255a | mayker-dev:builder | deliver | 5 | 6 | 26 | 5.2 | 2/1/2 | 6.50/10.00/1.50 | 8.5K | 60.4K | 72.4K | 0.838 | claude-sonnet-5-5 |  |
| agent-a9e91135dbc6527fc | mayker-dev:builder | deliver | 5 | 2 | 3 | 3.0 | 1/0/0 | 3.00/n/a/n/a | 794 | 43.3K | 53.5K | 0.542 | claude-sonnet-5-5 |  |
| agent-a9ee1566ca677ae6d | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/2/3 | 5.50/1.00/1.00 | 3.9K | 64.3K | 71.2K | 0.888 | claude-sonnet-5-5 |  |
| agent-aaa58a1127f265c9c | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 6.50/1.00/1.00 | 3.3K | 57.4K | 64.5K | 0.853 | claude-sonnet-5-5 |  |
| agent-aace392387cd9a88f | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 3.00/1.00/2.00 | 1.9K | 47.8K | 53.2K | 0.835 | claude-sonnet-5-5 |  |
| agent-aaded1816d3e84118 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 570 | 36.3K | 39.5K | 0.646 | claude-sonnet-5-5 |  |
| agent-ab874c3be07a0c82a | mayker-dev:planner | deliver | 5 | 13 | 42 | 3.5 | 0/2/9 | n/a/1.50/3.78 | 23.6K | 81.9K | 110.0K | 0.91 | claude-opus-5-5 |  |
| agent-ac1df768ecfbce7e5 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 1.00/2.00/3.67 | 4.7K | 49.6K | 54.8K | 0.861 | claude-fable-5-2 |  |
| agent-ac21517a1d4c31c19 | mayker-dev:builder | deliver | 5 | 9 | 18 | 2.25 | 2/1/5 | 4.00/2.00/1.60 | 6.3K | 68.0K | 78.5K | 0.894 | claude-sonnet-5-5 |  |
| agent-acc26d061777282a0 | mayker-dev:planner | deliver | 5 | 9 | 29 | 3.62 | 0/1/6 | n/a/2.00/3.67 | 11.9K | 77.3K | 101.5K | 0.854 | claude-opus-5-5 |  |
| agent-ace5e66b78f9b54fd | mayker-dev:reviewer | deliver | 5 | 6 | 26 | 5.2 | 5/0/0 | 5.20/n/a/n/a | 9.5K | 61.3K | 76.7K | 0.819 | claude-opus-5-5 |  |
| agent-ad1fc1a753bc3aa4a | mayker-dev:builder | deliver | 5 | 9 | 20 | 2.5 | 2/1/5 | 2.50/5.00/2.00 | 7.4K | 62.0K | 71.7K | 0.896 | claude-sonnet-5-5 |  |
| agent-ad44f927444a6fe68 | mayker-dev:builder | deliver | 5 | 16 | 34 | 2.27 | 3/1/10 | 2.33/4.00/2.20 | 7.9K | 78.6K | 87.4K | 0.941 | claude-sonnet-5-5 |  |
| agent-ad4c36816dfb140af | mayker-dev:orchestrator | deliver | 5 | 11 | 24 | 2.4 | 2/1/6 | 1.50/1.00/2.00 | 6.0K | 54.3K | 63.3K | 0.916 | claude-fable-5-2 |  |
| agent-ada2430ae50f75c93 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 782 | 40.3K | 47.8K | 0.719 | claude-sonnet-5-5 |  |
| agent-adea311dd1f63ab44 | mayker-dev:orchestrator | deliver | 5 | 10 | 20 | 2.22 | 1/2/6 | 5.00/2.00/1.83 | 9.4K | 77.9K | 92.5K | 0.898 | claude-fable-5-2 |  |
| agent-ae21df1f0179ed0b5 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 824 | 39.4K | 45.8K | 0.594 | claude-sonnet-5-5 |  |
| agent-aea6a60caea29e84d | mayker-dev:builder | deliver | 5 | 10 | 21 | 2.33 | 1/3/5 | 4.00/1.67/2.40 | 6.8K | 60.2K | 67.4K | 0.911 | claude-sonnet-5-5 |  |
| agent-aeae06351f36e35e0 | mayker-dev:reviewer | deliver | 5 | 5 | 17 | 4.25 | 4/0/0 | 4.25/n/a/n/a | 5.8K | 52.3K | 64.8K | 0.752 | claude-opus-5-5 |  |
| agent-aeb1fa9a4ed3c72c6 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 1/1/3 | 2.00/2.00/2.00 | 5.9K | 62.1K | 72.8K | 0.863 | claude-fable-5-2 |  |
| agent-aec3d1f3db8f206cc | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.75 | 1/1/2 | 5.00/2.00/2.00 | 3.7K | 48.3K | 55.0K | 0.772 | claude-fable-5-2 |  |
| agent-aee8a43b1197a04a4 | mayker-dev:builder | deliver | 5 | 13 | 24 | 2.0 | 1/1/9 | 2.00/2.00/2.11 | 4.9K | 59.8K | 65.8K | 0.933 | claude-sonnet-5-5 |  |
| agent-af3f2cdf585d76b8a | mayker-dev:builder | deliver | 5 | 9 | 21 | 2.62 | 2/2/4 | 4.50/4.00/1.00 | 6.2K | 64.8K | 73.4K | 0.874 | claude-sonnet-5-5 |  |
| agent-afa37453f2760ca70 | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 2/1/1 | 4.50/2.00/1.00 | 3.5K | 58.2K | 70.1K | 0.807 | claude-sonnet-5-5 |  |

**50 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 16, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 69.3K, peak 122.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.5K, 45.8K, 47.8K, 50.5K, 51.3K, 52.4K, 53.0K, 53.2K, 53.5K, 54.8K, 55.0K, 55.3K, 61.1K, 62.0K, 63.3K, 64.0K, 64.5K, 64.8K, 65.8K, 66.1K, 67.1K, 67.4K, 68.3K, 68.8K, 68.9K, 69.8K, 70.1K, 71.2K, 71.7K, 71.7K, 72.4K, 72.8K, 73.4K, 74.0K, 75.8K, 76.0K, 76.7K, 78.5K, 82.4K, 87.4K, 88.2K, 88.6K, 92.5K, 101.5K, 102.1K, 103.6K, 105.0K, 105.6K, 110.0K, 122.7K.

**All runs:** 1 run(s), wall 41m44s (sum of per-run walls, idle time between runs excluded), 576 turns, 1257 tool calls, 460.2K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 96/79/281 turns, 3.93/2.41/2.12 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m30s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

All runs: CI wait: 6m30s in `ci-poll.sh` calls; framework wall (wall less CI wait) 35m14s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 1/0/1).
