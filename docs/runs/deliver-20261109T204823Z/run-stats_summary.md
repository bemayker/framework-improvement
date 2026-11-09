# Run statistics, run

Generated 2026-11-09 21:33 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 45m15s | 525 | 1070 | 2.34 | 14 | 397.3K |  | 483.5K |  | 0.958 | claude-opus-5-5 | 85/75/255 (exec 80% of wall) | 4.24/2.45/1.77 |  |

Wall is this run's last step end minus its first step start; steps sum to 45m16s.

Exec turns took 36m06s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

CI wait: 11m00s in `ci-poll.sh` calls; framework wall (wall less CI wait) 34m14s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a027beb63a6251d3d | mayker-dev:orchestrator | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 3.50/1.00/1.25 | 4.0K | 55.7K | 63.2K | 0.858 | claude-fable-5-2 |  |
| agent-a06fe4863b04a1fad | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.2K | 50.2K | 64.4K | 0.744 | claude-sonnet-5-5 |  |
| agent-a09d68f9b01e8ebea | mayker-dev:builder | deliver | 5 | 6 | 24 | 4.8 | 1/1/3 | 5.00/11.00/2.67 | 7.4K | 61.9K | 72.0K | 0.806 | claude-sonnet-5-5 |  |
| agent-a0c09b0c021f435ea | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/2/2 | 5.00/5.00/1.00 | 6.7K | 62.0K | 70.8K | 0.867 | claude-sonnet-5-5 |  |
| agent-a0ddbf72636bcf572 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 4.7K | 48.9K | 60.5K | 0.739 | claude-opus-5-5 |  |
| agent-a1775367aa2a39487 | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 2/2/2 | 4.50/2.50/1.50 | 7.1K | 59.4K | 67.6K | 0.869 | claude-sonnet-5-5 |  |
| agent-a1943d40efa71bf7c | mayker-dev:builder | deliver | 5 | 12 | 26 | 2.36 | 2/1/7 | 3.50/3.00/2.14 | 6.9K | 61.8K | 69.2K | 0.924 | claude-sonnet-5-5 |  |
| agent-a1afec543081cbaea | mayker-dev:orchestrator | deliver | 5 | 5 | 16 | 4.0 | 1/1/2 | 9.00/2.00/2.50 | 5.7K | 61.1K | 73.0K | 0.803 | claude-fable-5-2 |  |
| agent-a28e250da95410956 | mayker-dev:orchestrator | deliver | 3 | 7 | 18 | 3.0 | 0/2/4 | n/a/2.00/3.50 | 9.3K | 82.0K | 103.0K | 0.82 | claude-fable-5-2 |  |
| agent-a2b5358cab44b3725 | mayker-dev:builder | deliver | 5 | 5 | 15 | 3.75 | 2/1/1 | 6.00/2.00/1.00 | 2.8K | 59.3K | 68.5K | 0.813 | claude-sonnet-5-5 |  |
| agent-a2e71d214e8cdd7f6 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 8.00/2.00/1.67 | 5.5K | 53.3K | 59.4K | 0.854 | claude-fable-5-2 |  |
| agent-a36b55db0001705f0 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 5.6K | 53.9K | 75.3K | 0.651 | claude-opus-5-5 |  |
| agent-a37e3b159bc646dc7 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 839 | 45.4K | 59.4K | 0.66 | claude-sonnet-5-5 |  |
| agent-a38f7e5052fb2f321 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.2K | 49.8K | 60.8K | 0.76 | claude-sonnet-5-5 |  |
| agent-a3f09452d1f067294 | mayker-dev:builder | deliver | 5 | 8 | 24 | 3.43 | 2/1/4 | 3.00/9.00/2.25 | 7.1K | 60.6K | 70.0K | 0.883 | claude-sonnet-5-5 |  |
| agent-a41197a2bd40454b5 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.2K | 55.5K | 72.9K | 0.714 | claude-opus-5-5 |  |
| agent-a46332f44badb9bec | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 1/1/2 | 8.00/2.00/2.00 | 5.3K | 57.9K | 67.0K | 0.812 | claude-fable-5-2 |  |
| agent-a525a28e75147417c | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 3.50/2.00/1.00 | 4.9K | 58.1K | 64.6K | 0.889 | claude-sonnet-5-5 |  |
| agent-a527567c351421075 | mayker-dev:orchestrator | deliver | 5 | 6 | 18 | 3.6 | 1/1/3 | 9.00/2.00/2.33 | 6.5K | 63.1K | 71.7K | 0.844 | claude-fable-5-2 |  |
| agent-a53b9f1e4864153d3 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 1/1/4 | 4.00/5.00/1.00 | 5.5K | 56.8K | 63.1K | 0.874 | claude-sonnet-5-5 |  |
| agent-a55b48a85da3a7e6c | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.4K | 45.6K | 61.5K | 0.55 | claude-opus-5-5 |  |
| agent-a5632aae12d80a354 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 6.00/3.50/1.00 | 5.1K | 60.2K | 67.8K | 0.839 | claude-sonnet-5-5 |  |
| agent-a56c5ada9bd56a17e | mayker-dev:builder | deliver | 5 | 11 | 26 | 2.6 | 1/1/7 | 4.00/6.00/2.14 | 5.2K | 63.2K | 70.0K | 0.918 | claude-sonnet-5-5 |  |
| agent-a59631cacc8d83b7a | mayker-dev:orchestrator | deliver | 8 | 4 | 7 | 2.33 | 2/0/1 | 3.00/n/a/1.00 | 7.9K | 53.3K | 60.6K | 0.776 | claude-fable-5-2 |  |
| agent-a64ba6ee5023d0869 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 3.50/3.00/1.00 | 6.6K | 59.3K | 67.8K | 0.868 | claude-sonnet-5-5 |  |
| agent-a6ae5e53da9733dd0 | mayker-dev:orchestrator | deliver | 5 | 5 | 15 | 3.75 | 1/1/2 | 7.00/2.00/3.00 | 5.1K | 54.2K | 63.6K | 0.765 | claude-fable-5-2 |  |
| agent-a6da15eb448d975d8 | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 5.00/2.00/1.50 | 3.0K | 47.9K | 53.8K | 0.829 | claude-fable-5-2 |  |
| agent-a6e015493a2842cd1 | mayker-dev:orchestrator | deliver | 5 | 5 | 17 | 4.25 | 0/2/2 | n/a/3.00/5.50 | 6.0K | 62.9K | 78.1K | 0.792 | claude-fable-5-2 |  |
| agent-a773f1a88e1a7f551 | mayker-dev:builder | deliver | 5 | 13 | 20 | 1.67 | 2/1/8 | 3.00/3.00/1.25 | 5.0K | 62.7K | 70.2K | 0.93 | claude-sonnet-5-5 |  |
| agent-a781bf689ac1dbfdd | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.6 | 3/3/4 | 2.67/1.33/1.00 | 7.4K | 60.4K | 67.3K | 0.918 | claude-sonnet-5-5 |  |
| agent-a783c5165648c1750 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 1.3K | 50.2K | 61.7K | 0.758 | claude-sonnet-5-5 |  |
| agent-a7e8924f867c6c73f | mayker-dev:planner | deliver | 5 | 11 | 28 | 2.8 | 2/1/6 | 3.50/2.00/1.83 | 16.4K | 82.5K | 102.3K | 0.902 | claude-opus-5-5 |  |
| agent-a84e9da6644e20e1e | mayker-dev:planner | deliver | 5 | 13 | 42 | 3.5 | 1/2/9 | 5.00/1.50/3.78 | 22.8K | 95.2K | 121.0K | 0.913 | claude-opus-5-5 |  |
| agent-a8c997acececf6c1d | mayker-dev:planner | deliver | 5 | 14 | 36 | 2.77 | 2/3/7 | 4.00/1.33/2.00 | 14.9K | 103.4K | 125.2K | 0.913 | claude-opus-5-5 |  |
| agent-a91cc0be60702e0b3 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 6.00/2.00/1.33 | 3.2K | 53.2K | 59.6K | 0.813 | claude-fable-5-2 |  |
| agent-a93da7d60d8522270 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 2.50/1.50/1.25 | 4.8K | 57.1K | 63.4K | 0.902 | claude-sonnet-5-5 |  |
| agent-a9f263640213a2ee2 | mayker-dev:planner | deliver | 5 | 12 | 30 | 2.73 | 0/2/9 | n/a/1.50/3.00 | 13.9K | 77.6K | 94.6K | 0.912 | claude-opus-5-5 |  |
| agent-aa6fac13cbff02add | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 4.2K | 50.4K | 63.3K | 0.686 | claude-opus-5-5 |  |
| agent-ab586c63ad384d442 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/1/4 | 6.00/1.00/1.00 | 3.6K | 61.2K | 67.6K | 0.889 | claude-sonnet-5-5 |  |
| agent-abb47b5f485fb074f | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 983 | 45.9K | 60.2K | 0.658 | claude-sonnet-5-5 |  |
| agent-abb9bdac7dfaa5fb9 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 6.00/3.50/1.00 | 4.4K | 54.2K | 59.3K | 0.878 | claude-sonnet-5-5 |  |
| agent-acb7367e99d386194 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 5.50/2.00/1.00 | 3.6K | 56.7K | 63.6K | 0.852 | claude-sonnet-5-5 |  |
| agent-ad0e88b79698258e2 | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 2/3/3 | 5.00/3.67/1.00 | 8.3K | 69.3K | 77.4K | 0.897 | claude-sonnet-5-5 |  |
| agent-ae9c307237b0eb03b | mayker-dev:planner | deliver | 5 | 11 | 27 | 2.7 | 1/2/6 | 5.00/1.50/2.17 | 12.2K | 74.7K | 90.3K | 0.89 | claude-opus-5-5 |  |
| agent-aeae1efe16e170d63 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 6.00/2.00/1.33 | 3.9K | 52.5K | 58.8K | 0.854 | claude-fable-5-2 |  |
| agent-af22692eb314fe246 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 3.2K | 51.7K | 57.4K | 0.856 | claude-fable-5-2 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 67.4K, peak 125.2K, 0 above the auto threshold (80% of the serving model's window). Distribution: 53.8K, 57.4K, 58.8K, 59.3K, 59.4K, 59.4K, 59.6K, 60.2K, 60.5K, 60.6K, 60.8K, 61.5K, 61.7K, 63.1K, 63.2K, 63.3K, 63.4K, 63.6K, 63.6K, 64.4K, 64.6K, 67.0K, 67.3K, 67.6K, 67.6K, 67.8K, 67.8K, 68.5K, 69.2K, 70.0K, 70.0K, 70.2K, 70.8K, 71.7K, 72.0K, 72.9K, 73.0K, 75.3K, 77.4K, 78.1K, 90.3K, 94.6K, 102.3K, 103.0K, 121.0K, 125.2K.

**All runs:** 1 run(s), wall 45m15s (sum of per-run walls, idle time between runs excluded), 525 turns, 1070 tool calls, 397.3K output tokens, cache hit 0.958.

Turn classes across every bucket, read / edit / exec: 85/75/255 turns, 4.24/2.45/1.77 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 36m06s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

All runs: CI wait: 11m00s in `ci-poll.sh` calls; framework wall (wall less CI wait) 34m14s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
