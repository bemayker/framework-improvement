# Run statistics, run

Generated 2026-11-13 16:28 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 44 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 45m52s | 552 | 1136 | 2.31 | 14 | 430.3K |  | 498.5K |  | 0.959 | claude-opus-5-5 | 80/89/276 (exec 64% of wall) | 4.33/2.58/1.76 |  |

Wall is this run's last step end minus its first step start; steps sum to 45m53s.

Exec turns took 29m13s of round trip (command plus model time, ADR 0006 section 2): 64% of wall.

CI wait: 5m22s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m29s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a00ca1875c6a3306d | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/2/3 | 3.00/4.00/1.00 | 5.1K | 56.7K | 63.3K | 0.861 | claude-sonnet-5-5 |  |
| agent-a03b416500bc34556 | mayker-dev:planner | deliver | 5 | 14 | 38 | 2.92 | 1/2/9 | 10.00/2.00/2.11 | 21.3K | 84.6K | 108.5K | 0.919 | claude-opus-5-5 |  |
| agent-a0652c4f82d54eb75 | mayker-dev:builder | deliver | 5 | 7 | 33 | 5.5 | 2/1/3 | 7.00/14.00/1.67 | 9.0K | 64.1K | 75.6K | 0.832 | claude-sonnet-5-5 |  |
| agent-a0a6f7d69f3c933bf | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/2/3 | 3.00/1.50/1.00 | 2.8K | 45.7K | 48.7K | 0.903 | claude-sonnet-5-5 |  |
| agent-a0c2c2ce4722e3906 | mayker-dev:reviewer | deliver | 5 | 3 | 21 | 10.5 | 2/0/0 | 10.50/n/a/n/a | 5.8K | 48.0K | 66.6K | 0.537 | claude-opus-5-5 |  |
| agent-a135821f63f6abf4a | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 4.00/2.00/2.00 | 4.1K | 47.0K | 54.1K | 0.808 | claude-fable-5-2 |  |
| agent-a18d074cb588d6880 | mayker-dev:orchestrator | deliver | 3 | 12 | 21 | 1.91 | 1/3/7 | 6.00/1.33/1.57 | 9.4K | 90.3K | 104.4K | 0.904 | claude-fable-5-2 |  |
| agent-a1b17d92d251e2228 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 884 | 46.0K | 56.4K | 0.765 | claude-sonnet-5-5 |  |
| agent-a274d812108ead104 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/1/3 | 3.00/9.00/2.67 | 6.6K | 61.3K | 70.7K | 0.866 | claude-sonnet-5-5 |  |
| agent-a294e7d6287de4ce7 | mayker-dev:orchestrator | deliver | 5 | 8 | 22 | 3.14 | 2/1/4 | 5.50/2.00/2.25 | 8.2K | 78.9K | 94.5K | 0.872 | claude-fable-5-2 |  |
| agent-a35ab969647b03bb0 | mayker-dev:orchestrator | deliver | 5 | 9 | 31 | 3.88 | 1/1/4 | 10.00/3.00/3.25 | 13.3K | 84.8K | 105.9K | 0.879 | claude-fable-5-2 |  |
| agent-a3c2f3a28f832756a | mayker-dev:reviewer | deliver | 5 | 6 | 23 | 4.6 | 5/0/0 | 4.60/n/a/n/a | 6.5K | 55.0K | 64.7K | 0.832 | claude-opus-5-5 |  |
| agent-a4ede22417dfc535d | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 1/4/2 | 5.00/1.75/1.00 | 3.3K | 52.2K | 56.2K | 0.897 | claude-sonnet-5-5 |  |
| agent-a51baaf8252c4403c | mayker-dev:reviewer | deliver | 5 | 3 | 21 | 10.5 | 2/0/0 | 10.50/n/a/n/a | 6.3K | 48.8K | 67.8K | 0.6 | claude-opus-5-5 |  |
| agent-a56c024b813c99386 | mayker-dev:orchestrator | deliver | 5 | 10 | 19 | 2.11 | 1/3/5 | 4.00/1.67/2.00 | 7.4K | 72.3K | 84.3K | 0.903 | claude-fable-5-2 |  |
| agent-a5cc240e6baecafa5 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 6.1K | 47.7K | 64.5K | 0.549 | claude-opus-5-5 |  |
| agent-a5d8a45a97d2b6840 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 6.00/1.00/1.00 | 3.1K | 54.3K | 60.7K | 0.854 | claude-sonnet-5-5 |  |
| agent-a692ee79660919225 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 50.8K | 62.3K | 0.758 | claude-sonnet-5-5 |  |
| agent-a6e1818f2808a4127 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/3.00/1.00 | 5.4K | 53.4K | 59.5K | 0.892 | claude-sonnet-5-5 |  |
| agent-a6f30921df2328974 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 45.9K | 55.9K | 0.767 | claude-sonnet-5-5 |  |
| agent-a75ca8ccf83636b61 | mayker-dev:planner | deliver | 5 | 11 | 34 | 3.4 | 0/1/8 | n/a/2.00/3.38 | 13.4K | 78.5K | 100.8K | 0.898 | claude-opus-5-5 |  |
| agent-a77a536fbcf006eef | mayker-dev:orchestrator | deliver | 5 | 11 | 24 | 2.4 | 3/1/6 | 3.00/1.00/2.33 | 8.5K | 66.2K | 78.0K | 0.893 | claude-fable-5-2 |  |
| agent-a7b2953358a2607df | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 1/2/4 | 4.00/2.00/1.25 | 4.7K | 51.8K | 57.2K | 0.894 | claude-sonnet-5-5 |  |
| agent-a7c077b0e7448a099 | mayker-dev:orchestrator | deliver | 5 | 8 | 16 | 2.29 | 1/1/5 | 5.00/2.00/1.80 | 7.0K | 57.9K | 66.8K | 0.856 | claude-fable-5-2 |  |
| agent-a7f8a7b14d4ffdec4 | mayker-dev:builder | deliver | 5 | 11 | 27 | 2.7 | 4/3/3 | 3.00/4.00/1.00 | 9.1K | 69.7K | 78.8K | 0.914 | claude-sonnet-5-5 |  |
| agent-a8a5860609d3cc4e6 | mayker-dev:builder | deliver | 5 | 10 | 18 | 2.0 | 2/2/5 | 2.00/3.00/1.60 | 7.8K | 58.8K | 65.0K | 0.912 | claude-sonnet-5-5 |  |
| agent-a8a895b0f3c18838c | mayker-dev:builder | deliver | 5 | 6 | 24 | 4.8 | 2/1/2 | 5.00/11.00/1.50 | 7.2K | 60.5K | 71.8K | 0.838 | claude-sonnet-5-5 |  |
| agent-a8fb91baf5d5dd1b1 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/1/6 | 2.50/2.00/1.17 | 5.6K | 56.3K | 62.7K | 0.912 | claude-sonnet-5-5 |  |
| agent-a9043afb5258cc98c | mayker-dev:builder | deliver | 5 | 17 | 33 | 2.06 | 3/1/11 | 2.33/3.00/2.00 | 7.0K | 69.7K | 78.1K | 0.945 | claude-sonnet-5-5 |  |
| agent-a9ac1e285d49eb581 | mayker-dev:builder | deliver | 5 | 17 | 35 | 2.19 | 1/3/11 | 6.00/4.00/1.45 | 10.1K | 60.9K | 68.2K | 0.947 | claude-sonnet-5-5 |  |
| agent-aa2bafa0adcc6a591 | mayker-dev:builder | deliver | 5 | 14 | 23 | 1.77 | 3/1/8 | 2.67/3.00/1.38 | 5.1K | 61.4K | 67.2K | 0.937 | claude-sonnet-5-5 |  |
| agent-ab48ad6e274dcb822 | mayker-dev:planner | deliver | 5 | 17 | 40 | 2.5 | 2/1/12 | 4.00/2.00/2.08 | 21.2K | 86.6K | 119.5K | 0.919 | claude-opus-5-5 |  |
| agent-ab4a8369c2e15fde6 | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 5.1K | 46.8K | 63.8K | 0.612 | claude-opus-5-5 |  |
| agent-abda5def4db0d5dfa | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 2/1/1 | 5.50/2.00/1.00 | 2.8K | 51.2K | 57.6K | 0.826 | claude-sonnet-5-5 |  |
| agent-ac0a8d894fc4a1d18 | mayker-dev:orchestrator | deliver | 5 | 4 | 8 | 2.67 | 1/1/1 | 5.00/2.00/1.00 | 3.1K | 43.5K | 47.1K | 0.802 | claude-fable-5-2 |  |
| agent-ad74491bf2014c875 | mayker-dev:orchestrator | deliver | 5 | 7 | 19 | 3.17 | 2/1/3 | 6.00/2.00/1.67 | 6.9K | 62.9K | 73.6K | 0.833 | claude-fable-5-2 |  |
| agent-ae3fd823b4ebccb14 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/1/5 | 2.50/2.00/1.20 | 5.4K | 59.2K | 66.2K | 0.9 | claude-sonnet-5-5 |  |
| agent-ae77d3b3b3771a4d1 | mayker-dev:orchestrator | deliver | 8 | 3 | 7 | 3.5 | 1/0/1 | 6.00/n/a/1.00 | 8.5K | 55.2K | 64.5K | 0.694 | claude-fable-5-2 |  |
| agent-aede8367e73e860b4 | mayker-dev:builder | deliver | 5 | 12 | 22 | 2.0 | 1/1/8 | 3.00/3.00/1.88 | 5.4K | 61.3K | 68.3K | 0.925 | claude-sonnet-5-5 |  |
| agent-aef79f1428f4f2ef0 | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 0/1/4 | n/a/2.00/2.75 | 5.1K | 48.7K | 55.3K | 0.811 | claude-fable-5-2 |  |
| agent-af4c678adeaa37f27 | mayker-dev:planner | deliver | 5 | 11 | 30 | 3.0 | 1/2/7 | 5.00/2.00/3.00 | 16.9K | 83.2K | 101.5K | 0.889 | claude-opus-5-5 |  |
| agent-af6a2b5fc7cede3d4 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 46.0K | 55.9K | 0.767 | claude-sonnet-5-5 |  |
| agent-af768b72974260862 | mayker-dev:planner | deliver | 5 | 12 | 31 | 2.82 | 1/2/7 | 4.00/1.00/2.86 | 16.5K | 79.9K | 98.9K | 0.91 | claude-opus-5-5 |  |
| agent-afe25b3ac947fd95c | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 46.9K | 60.4K | 0.748 | claude-sonnet-5-5 |  |

**44 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 11, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 66.4K, peak 119.5K, 0 above the auto threshold (80% of the serving model's window). Distribution: 47.1K, 48.7K, 54.1K, 55.3K, 55.9K, 55.9K, 56.2K, 56.4K, 57.2K, 57.6K, 59.5K, 60.4K, 60.7K, 62.3K, 62.7K, 63.3K, 63.8K, 64.5K, 64.5K, 64.7K, 65.0K, 66.2K, 66.6K, 66.8K, 67.2K, 67.8K, 68.2K, 68.3K, 70.7K, 71.8K, 73.6K, 75.6K, 78.0K, 78.1K, 78.8K, 84.3K, 94.5K, 98.9K, 100.8K, 101.5K, 104.4K, 105.9K, 108.5K, 119.5K.

**All runs:** 1 run(s), wall 45m52s (sum of per-run walls, idle time between runs excluded), 552 turns, 1136 tool calls, 430.3K output tokens, cache hit 0.959.

Turn classes across every bucket, read / edit / exec: 80/89/276 turns, 4.33/2.58/1.76 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 29m13s of round trip (command plus model time, ADR 0006 section 2): 64% of wall.

All runs: CI wait: 5m22s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m29s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
