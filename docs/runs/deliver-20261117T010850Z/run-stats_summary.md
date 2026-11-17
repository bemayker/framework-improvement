# Run statistics, run

Generated 2026-11-17 01:55 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 49 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 46m32s | 581 | 1197 | 2.38 | 16 | 440.0K |  | 475.0K |  | 0.96 | claude-opus-5-5 | 75/78/289 (exec 78% of wall) | 4.24/2.46/1.87 |  |

Wall is this run's last step end minus its first step start; steps sum to 46m32s.

Exec turns took 36m23s of round trip (command plus model time, ADR 0006 section 2): 78% of wall.

CI wait: 7m03s in `ci-poll.sh` calls; framework wall (wall less CI wait) 39m28s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a02d8a70f4385c2bc | mayker-dev:builder | deliver | 5 | 8 | 19 | 2.71 | 2/2/3 | 5.00/3.00/1.00 | 4.2K | 56.7K | 62.4K | 0.891 | claude-sonnet-5-5 |  |
| agent-a04856eb0e53eb9c2 | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 6.7K | 44.9K | 62.3K | 0.537 | claude-opus-5-5 |  |
| agent-a0815724764d3c824 | mayker-dev:orchestrator | deliver | 5 | 8 | 23 | 3.29 | 0/1/4 | n/a/2.00/2.75 | 5.9K | 57.8K | 65.9K | 0.858 | claude-fable-5-2 |  |
| agent-a089ed6677037b05d | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 6.50/1.00/1.00 | 3.5K | 56.4K | 63.1K | 0.873 | claude-sonnet-5-5 |  |
| agent-a0ae45467d64f1b7e | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 2/2/2 | 2.50/2.00/1.00 | 5.5K | 50.9K | 58.2K | 0.873 | claude-sonnet-5-5 |  |
| agent-a0c32c04a1d62a12b | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 2.00/n/a/1.00 | 765 | 40.3K | 45.1K | 0.736 | claude-sonnet-5-5 |  |
| agent-a10de4ec4b0591dc1 | mayker-dev:builder | deliver | 5 | 12 | 21 | 1.91 | 2/1/7 | 3.50/3.00/1.43 | 4.7K | 61.6K | 67.6K | 0.926 | claude-sonnet-5-5 |  |
| agent-a11ad79706cfc18be | mayker-dev:orchestrator | deliver | 3 | 12 | 34 | 3.09 | 0/2/9 | n/a/4.50/2.78 | 10.9K | 96.3K | 112.3K | 0.903 | claude-fable-5-2 |  |
| agent-a133d9808ec6e4deb | mayker-dev:builder | deliver | 5 | 10 | 18 | 2.0 | 1/1/7 | 4.00/3.00/1.57 | 5.1K | 60.4K | 66.7K | 0.911 | claude-sonnet-5-5 |  |
| agent-a14de9c7a6a8ef95c | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 6.4K | 46.2K | 65.2K | 0.597 | claude-opus-5-5 |  |
| agent-a181b7cb2c3c655b8 | mayker-dev:orchestrator | deliver | 5 | 9 | 27 | 3.38 | 2/1/4 | 4.50/2.00/3.75 | 9.9K | 79.6K | 102.5K | 0.875 | claude-fable-5-2 |  |
| agent-a199610c797091785 | mayker-dev:orchestrator | deliver | 5 | 7 | 19 | 3.17 | 0/1/5 | n/a/2.00/3.40 | 7.4K | 54.9K | 62.0K | 0.872 | claude-fable-5-2 |  |
| agent-a1aa56671a138ef7c | mayker-dev:planner | deliver | 5 | 10 | 34 | 3.78 | 1/1/7 | 6.00/2.00/3.71 | 20.1K | 87.0K | 115.3K | 0.883 | claude-opus-5-5 |  |
| agent-a1f2a63a393013a01 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.50/1.50/1.00 | 6.1K | 53.6K | 59.5K | 0.904 | claude-sonnet-5-5 |  |
| agent-a20e63f2e4b8b057c | mayker-dev:orchestrator | deliver | 5 | 9 | 18 | 2.25 | 0/1/6 | n/a/2.00/2.50 | 5.3K | 57.3K | 63.3K | 0.902 | claude-fable-5-2 |  |
| agent-a22cfedacbfe92e1a | mayker-dev:reviewer | deliver | 5 | 5 | 27 | 6.75 | 4/0/0 | 6.75/n/a/n/a | 9.5K | 57.2K | 72.8K | 0.778 | claude-opus-5-5 |  |
| agent-a23958cb777d4a8ea | mayker-dev:builder | deliver | 5 | 11 | 27 | 2.7 | 2/2/6 | 3.50/5.00/1.67 | 7.6K | 64.3K | 72.3K | 0.898 | claude-sonnet-5-5 |  |
| agent-a2549f1a37f178ea5 | mayker-dev:orchestrator | deliver | 8 | 4 | 8 | 2.67 | 3/0/0 | 2.67/n/a/n/a | 7.8K | 55.0K | 64.3K | 0.771 | claude-fable-5-2 |  |
| agent-a2f02b2741e513357 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 2/1/3 | 4.00/1.00/1.00 | 2.6K | 59.9K | 67.3K | 0.871 | claude-sonnet-5-5 |  |
| agent-a3081873178b3ebae | mayker-dev:orchestrator | deliver | 5 | 8 | 24 | 3.43 | 0/2/4 | n/a/3.00/2.75 | 6.1K | 78.1K | 91.0K | 0.854 | claude-fable-5-2 |  |
| agent-a33cc0da31f203319 | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 1/2/3 | 6.00/3.00/1.00 | 5.1K | 59.2K | 67.0K | 0.838 | claude-sonnet-5-5 |  |
| agent-a3f8133ea7413aa27 | mayker-dev:orchestrator | deliver | 5 | 5 | 17 | 4.25 | 0/1/3 | n/a/2.00/5.00 | 6.3K | 49.9K | 57.1K | 0.822 | claude-fable-5-2 |  |
| agent-a4d7d3d0c993f5f69 | mayker-dev:builder | deliver | 5 | 8 | 32 | 4.57 | 2/1/4 | 7.00/12.00/1.50 | 9.2K | 66.4K | 76.3K | 0.881 | claude-sonnet-5-5 |  |
| agent-a4fe05854bf42eff9 | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 5.3K | 43.0K | 57.2K | 0.556 | claude-opus-5-5 |  |
| agent-a5634c43f4248e614 | mayker-dev:orchestrator | deliver | 5 | 10 | 28 | 3.11 | 0/3/5 | n/a/1.67/3.20 | 9.4K | 85.8K | 101.2K | 0.897 | claude-fable-5-2 |  |
| agent-a5f53adc6d553cc48 | mayker-dev:builder | deliver | 5 | 7 | 24 | 4.0 | 2/3/1 | 5.00/4.33/1.00 | 7.8K | 61.7K | 71.6K | 0.864 | claude-sonnet-5-5 |  |
| agent-a621892201aeaa441 | mayker-dev:planner | deliver | 5 | 5 | 14 | 3.5 | 1/1/2 | 8.00/2.00/2.00 | 9.2K | 54.1K | 62.3K | 0.818 | claude-opus-5-5 |  |
| agent-a881b1091dd10c45f | mayker-dev:builder | deliver | 5 | 11 | 26 | 2.6 | 1/4/5 | 2.00/3.00/2.40 | 6.7K | 59.1K | 65.2K | 0.92 | claude-sonnet-5-5 |  |
| agent-a93ff1567fe2dfd54 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 0/1/3 | n/a/3.00/2.00 | 5.8K | 69.3K | 81.4K | 0.832 | claude-fable-5-2 |  |
| agent-a941a7137750b3b2f | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 1/1/2 | 3.00/2.00/5.00 | 3.6K | 46.3K | 51.1K | 0.834 | claude-fable-5-2 |  |
| agent-a94a6edfe97a125fd | mayker-dev:planner | deliver | 5 | 10 | 27 | 3.0 | 1/2/4 | 2.00/1.50/2.75 | 11.4K | 79.3K | 98.5K | 0.876 | claude-opus-5-5 |  |
| agent-a9b36fa9a7b8b527b | mayker-dev:planner | deliver | 5 | 10 | 31 | 3.44 | 2/1/6 | 5.50/2.00/3.00 | 12.1K | 82.8K | 102.3K | 0.892 | claude-opus-5-5 |  |
| agent-aa3b5bd7337b79ea2 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 3.00/2.00/1.25 | 5.1K | 59.3K | 67.5K | 0.885 | claude-sonnet-5-5 |  |
| agent-aa677fe56ebb264b3 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 4.50/4.50/1.00 | 7.3K | 62.3K | 70.9K | 0.867 | claude-sonnet-5-5 |  |
| agent-aaa85b854f92dc86f | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 5.50/1.00/1.00 | 3.1K | 53.2K | 58.4K | 0.878 | claude-sonnet-5-5 |  |
| agent-aacd5b9167bad83da | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 2/2/6 | 5.50/2.00/2.00 | 16.5K | 86.2K | 108.3K | 0.895 | claude-opus-5-5 |  |
| agent-aafc90eb2beffb123 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 0/2/3 | n/a/1.50/1.67 | 6.2K | 67.7K | 79.9K | 0.858 | claude-fable-5-2 |  |
| agent-ab32d1e630973d61e | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.0K | 46.2K | 57.2K | 0.682 | claude-sonnet-5-5 |  |
| agent-ab651e1bcdacfd9c7 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 4.8K | 43.4K | 59.5K | 0.543 | claude-opus-5-5 |  |
| agent-ab711abcf2bc827dd | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.8 | 0/1/2 | n/a/2.00/2.00 | 4.7K | 59.2K | 69.3K | 0.864 | claude-fable-5-2 |  |
| agent-ab999440b665cc7de | mayker-dev:planner | deliver | 5 | 13 | 38 | 3.17 | 0/1/10 | n/a/2.00/3.10 | 16.3K | 89.5K | 110.2K | 0.917 | claude-opus-5-5 |  |
| agent-abed694a64245bf5e | mayker-dev:builder | deliver | 5 | 10 | 19 | 2.11 | 3/3/3 | 2.67/2.67/1.00 | 8.2K | 62.5K | 70.0K | 0.909 | claude-sonnet-5-5 |  |
| agent-ad501c785afd4e7ce | mayker-dev:builder | deliver | 5 | 11 | 15 | 1.5 | 3/3/4 | 2.33/1.33/1.00 | 6.4K | 55.6K | 61.5K | 0.921 | claude-sonnet-5-5 |  |
| agent-ada90cfeef56154e2 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.0K | 47.2K | 58.7K | 0.678 | claude-sonnet-5-5 |  |
| agent-adcccb72f23c178b8 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 3.00/n/a/1.00 | 876 | 46.3K | 54.2K | 0.704 | claude-sonnet-5-5 |  |
| agent-ae329a727fca9be72 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 974 | 49.2K | 61.7K | 0.671 | claude-sonnet-5-5 |  |
| agent-ae4cae18bc9837aa6 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 0/1/2 | n/a/2.00/3.00 | 3.5K | 60.0K | 70.5K | 0.839 | claude-fable-5-2 |  |
| agent-ae8b4c70f7a1a9f41 | mayker-dev:builder | deliver | 5 | 17 | 29 | 1.81 | 2/1/13 | 2.50/2.00/1.69 | 7.6K | 64.7K | 72.4K | 0.946 | claude-sonnet-5-5 |  |
| agent-af570cb61da0e5884 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 0/1/3 | n/a/2.00/3.00 | 5.2K | 62.3K | 78.9K | 0.823 | claude-fable-5-2 |  |

**49 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 15, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 67.0K, peak 115.3K, 0 above the auto threshold (80% of the serving model's window). Distribution: 45.1K, 51.1K, 54.2K, 57.1K, 57.2K, 57.2K, 58.2K, 58.4K, 58.7K, 59.5K, 59.5K, 61.5K, 61.7K, 62.0K, 62.3K, 62.3K, 62.4K, 63.1K, 63.3K, 64.3K, 65.2K, 65.2K, 65.9K, 66.7K, 67.0K, 67.3K, 67.5K, 67.6K, 69.3K, 70.0K, 70.5K, 70.9K, 71.6K, 72.3K, 72.4K, 72.8K, 76.3K, 78.9K, 79.9K, 81.4K, 91.0K, 98.5K, 101.2K, 102.3K, 102.5K, 108.3K, 110.2K, 112.3K, 115.3K.

**All runs:** 1 run(s), wall 46m32s (sum of per-run walls, idle time between runs excluded), 581 turns, 1197 tool calls, 440.0K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 75/78/289 turns, 4.24/2.46/1.87 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 36m23s of round trip (command plus model time, ADR 0006 section 2): 78% of wall.

All runs: CI wait: 7m03s in `ci-poll.sh` calls; framework wall (wall less CI wait) 39m28s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
