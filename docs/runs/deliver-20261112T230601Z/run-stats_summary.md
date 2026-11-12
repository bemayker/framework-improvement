# Run statistics, run

Generated 2026-11-12 23:48 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 48 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 42m19s | 555 | 1163 | 2.41 | 15 | 449.5K |  | 520.0K |  | 0.958 | claude-opus-5-5 | 85/77/273 (exec 76% of wall) | 4.54/2.34/1.88 |  |

Wall is this run's last step end minus its first step start; steps sum to 42m19s.

Exec turns took 32m10s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

CI wait: 5m29s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m50s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0075f01606cee907 | mayker-dev:orchestrator | deliver | 8 | 3 | 9 | 4.5 | 1/0/1 | 7.00/n/a/2.00 | 8.7K | 57.3K | 66.8K | 0.612 | claude-fable-5-2 |  |
| agent-a02a075b6d98a2bea | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 1/2/7 | 1.00/2.00/2.43 | 16.6K | 79.6K | 96.7K | 0.899 | claude-opus-5-5 |  |
| agent-a2882acde939ebf2f | mayker-dev:builder | deliver | 5 | 7 | 19 | 3.17 | 2/2/2 | 5.00/3.50/1.00 | 8.8K | 65.9K | 75.5K | 0.865 | claude-sonnet-5-5 |  |
| agent-a2ac3720d73e1f4f6 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 6.1K | 52.9K | 70.0K | 0.713 | claude-opus-5-5 |  |
| agent-a2ce5c34d48251e35 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.6 | 2/1/2 | 4.00/2.00/1.50 | 5.3K | 50.9K | 57.3K | 0.875 | claude-fable-5-2 |  |
| agent-a33110021008337dc | mayker-dev:orchestrator | deliver | 3 | 12 | 27 | 2.45 | 1/3/7 | 4.00/1.00/2.86 | 13.2K | 99.1K | 119.5K | 0.899 | claude-fable-5-2 |  |
| agent-a35441b4f86d546c8 | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 3.50/2.00/2.00 | 4.0K | 55.2K | 63.3K | 0.847 | claude-fable-5-2 |  |
| agent-a3abc296e67b06df4 | mayker-dev:orchestrator | deliver | 5 | 7 | 19 | 3.17 | 1/3/2 | 4.00/2.00/4.50 | 8.1K | 86.1K | 110.1K | 0.838 | claude-fable-5-2 |  |
| agent-a3dce2d9dcf9879e7 | mayker-dev:planner | deliver | 5 | 13 | 31 | 2.58 | 0/2/9 | n/a/1.50/2.56 | 12.4K | 73.9K | 91.3K | 0.905 | claude-opus-5-5 |  |
| agent-a4162d82e8db20ea1 | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/1/4 | 4.00/2.00/1.50 | 5.5K | 60.9K | 69.8K | 0.883 | claude-sonnet-5-5 |  |
| agent-a4756981ac73b9a81 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 3.50/2.00/2.50 | 4.4K | 54.7K | 62.4K | 0.81 | claude-fable-5-2 |  |
| agent-a4da9b79bcc4e429c | mayker-dev:orchestrator | deliver | 5,8 | 9 | 19 | 2.38 | 1/3/4 | 4.00/1.33/2.75 | 6.7K | 81.8K | 98.5K | 0.883 | claude-fable-5-2 |  |
| agent-a53ecd49cdc6e1bbd | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 3.6K | 51.9K | 58.0K | 0.854 | claude-fable-5-2 |  |
| agent-a5a666719da6ce695 | mayker-dev:planner | deliver | 5 | 14 | 32 | 2.46 | 2/1/9 | 1.00/2.00/2.56 | 17.2K | 75.4K | 96.9K | 0.921 | claude-opus-5-5 |  |
| agent-a6688f96c7333293f | mayker-dev:planner | deliver | 5 | 11 | 31 | 3.1 | 3/1/6 | 3.33/2.00/3.17 | 17.5K | 77.6K | 101.1K | 0.897 | claude-opus-5-5 |  |
| agent-a6a3310c348e81bd7 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 7.00/4.00/1.50 | 6.4K | 62.6K | 71.5K | 0.844 | claude-sonnet-5-5 |  |
| agent-a6a4df7fbbffabd42 | mayker-dev:builder | deliver | 5 | 4 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.6K | 53.9K | 69.1K | 0.741 | claude-sonnet-5-5 |  |
| agent-a6e878826114d5f02 | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 3.33 | 1/1/1 | 7.00/2.00/1.00 | 3.2K | 52.3K | 58.7K | 0.78 | claude-fable-5-2 |  |
| agent-a7035aaed96587a0e | mayker-dev:orchestrator | deliver | 5 | 11 | 21 | 2.1 | 1/3/6 | 6.00/1.33/1.83 | 11.0K | 98.4K | 117.9K | 0.903 | claude-fable-5-2 |  |
| agent-a71ee8fa7f6903adf | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/1/4 | 3.00/5.00/1.00 | 5.9K | 57.8K | 63.8K | 0.89 | claude-sonnet-5-5 |  |
| agent-a73603ef072da2721 | mayker-dev:reviewer | deliver | 5 | 5 | 20 | 5.0 | 4/0/0 | 5.00/n/a/n/a | 5.4K | 55.6K | 67.5K | 0.791 | claude-opus-5-5 |  |
| agent-a7368bda7e15033cf | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 968 | 46.4K | 60.9K | 0.656 | claude-sonnet-5-5 |  |
| agent-a7e179cd8a5c75e7b | mayker-dev:reviewer | deliver | 5 | 6 | 29 | 5.8 | 5/0/0 | 5.80/n/a/n/a | 8.2K | 61.9K | 74.7K | 0.824 | claude-opus-5-5 |  |
| agent-a87542b7ef4d8ed36 | mayker-dev:planner | deliver | 5 | 14 | 40 | 3.08 | 1/2/9 | 12.00/1.50/2.22 | 23.9K | 91.4K | 120.9K | 0.916 | claude-opus-5-5 |  |
| agent-a88d72782847bdf13 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 4.50/2.00/1.00 | 3.1K | 55.4K | 62.8K | 0.85 | claude-sonnet-5-5 |  |
| agent-a8e0413b5d008ad5a | mayker-dev:builder | deliver | 5 | 14 | 31 | 2.38 | 2/2/8 | 3.50/3.50/2.00 | 7.0K | 68.1K | 76.1K | 0.934 | claude-sonnet-5-5 |  |
| agent-a8ee65142daf2cf3b | mayker-dev:builder | deliver | 5 | 11 | 17 | 1.7 | 3/2/5 | 2.33/1.50/1.40 | 6.8K | 61.0K | 68.0K | 0.918 | claude-sonnet-5-5 |  |
| agent-a93706b83a8ef8af1 | mayker-dev:builder | deliver | 5 | 8 | 36 | 5.14 | 2/3/2 | 8.00/6.00/1.00 | 9.6K | 68.1K | 78.9K | 0.855 | claude-sonnet-5-5 |  |
| agent-a95e27b77d7f64332 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 5.7K | 45.6K | 61.0K | 0.555 | claude-opus-5-5 |  |
| agent-a9f1468353711e81d | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 6.00/2.00/1.67 | 4.6K | 58.5K | 67.8K | 0.843 | claude-fable-5-2 |  |
| agent-aa02436b95da7c9ba | mayker-dev:builder | deliver | 5 | 4 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.9K | 56.1K | 72.1K | 0.737 | claude-sonnet-5-5 |  |
| agent-aa32588b197cedef3 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 2.00/2.00/4.00 | 5.9K | 58.6K | 68.8K | 0.841 | claude-fable-5-2 |  |
| agent-aa62a42d6bf49b39e | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 1.6K | 52.0K | 67.4K | 0.739 | claude-sonnet-5-5 |  |
| agent-aa910665d6ab26575 | mayker-dev:reviewer | deliver | 5 | 3 | 22 | 11.0 | 2/0/0 | 11.00/n/a/n/a | 5.0K | 49.3K | 71.0K | 0.52 | claude-opus-5-5 |  |
| agent-aacf3a9a784de710f | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 2/1/1 | 2.50/1.00/1.00 | 1.4K | 59.4K | 70.2K | 0.808 | claude-sonnet-5-5 |  |
| agent-abf65b0385bdb9146 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 2/1/1 | 5.50/2.00/1.00 | 3.0K | 52.4K | 59.3K | 0.823 | claude-sonnet-5-5 |  |
| agent-abf92973ffbda328e | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 5.00/9.00/1.00 | 6.6K | 59.5K | 68.3K | 0.845 | claude-sonnet-5-5 |  |
| agent-ac6187518e6d3c4a2 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 2/1/1 | 5.50/2.00/1.00 | 3.0K | 52.0K | 58.8K | 0.824 | claude-sonnet-5-5 |  |
| agent-acb1a7c4b27a1e095 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 1/2/3 | 6.00/5.00/2.33 | 7.8K | 65.0K | 74.3K | 0.866 | claude-sonnet-5-5 |  |
| agent-acf5811e2ddf2f2d8 | mayker-dev:builder | deliver | 5 | 17 | 32 | 2.0 | 3/1/11 | 3.00/2.00/1.82 | 5.2K | 58.5K | 65.4K | 0.947 | claude-sonnet-5-5 |  |
| agent-ae96954590e636475 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 4.00/2.00/1.00 | 3.1K | 56.0K | 62.2K | 0.875 | claude-sonnet-5-5 |  |
| agent-aeba60e1616699fc0 | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 0/1/3 | n/a/2.00/3.67 | 4.4K | 52.6K | 60.2K | 0.771 | claude-fable-5-2 |  |
| agent-aee5beaf3db04485c | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 6.00/3.50/1.00 | 5.2K | 60.6K | 67.1K | 0.842 | claude-sonnet-5-5 |  |
| agent-aee971ccbb822c92e | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 1/1/5 | 4.00/2.00/1.60 | 5.5K | 56.0K | 62.5K | 0.89 | claude-sonnet-5-5 |  |
| agent-af1ca78b0f77746e8 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 3.00/3.00/1.25 | 6.5K | 57.8K | 65.5K | 0.887 | claude-sonnet-5-5 |  |
| agent-af40f0b476909fa86 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 0/1/4 | n/a/2.00/3.50 | 5.3K | 51.5K | 58.1K | 0.853 | claude-fable-5-2 |  |
| agent-af7ad148835df7f42 | mayker-dev:orchestrator | deliver | 5 | 7 | 19 | 3.17 | 1/1/4 | 7.00/2.00/2.50 | 5.6K | 56.1K | 63.9K | 0.87 | claude-fable-5-2 |  |
| agent-afd339e7b1a865937 | mayker-dev:builder | deliver | 5 | 14 | 36 | 2.77 | 1/1/10 | 5.00/4.00/2.60 | 7.9K | 69.1K | 79.0K | 0.932 | claude-sonnet-5-5 |  |

**48 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 15, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 68.1K, peak 120.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 57.3K, 58.0K, 58.1K, 58.7K, 58.8K, 59.3K, 60.2K, 60.9K, 61.0K, 62.2K, 62.4K, 62.5K, 62.8K, 63.3K, 63.8K, 63.9K, 65.4K, 65.5K, 66.8K, 67.1K, 67.4K, 67.5K, 67.8K, 68.0K, 68.3K, 68.8K, 69.1K, 69.8K, 70.0K, 70.2K, 71.0K, 71.5K, 72.1K, 74.3K, 74.7K, 75.5K, 76.1K, 78.9K, 79.0K, 91.3K, 96.7K, 96.9K, 98.5K, 101.1K, 110.1K, 117.9K, 119.5K, 120.9K.

**All runs:** 1 run(s), wall 42m19s (sum of per-run walls, idle time between runs excluded), 555 turns, 1163 tool calls, 449.5K output tokens, cache hit 0.958.

Turn classes across every bucket, read / edit / exec: 85/77/273 turns, 4.54/2.34/1.88 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 32m10s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

All runs: CI wait: 5m29s in `ci-poll.sh` calls; framework wall (wall less CI wait) 36m50s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
