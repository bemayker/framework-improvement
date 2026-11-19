# Run statistics, run

Generated 2026-11-19 01:53 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 47 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 45m53s | 537 | 1079 | 2.3 | 14 | 410.0K |  | 482.6K |  | 0.961 | claude-opus-5-5 | 74/66/279 (exec 74% of wall) | 4.35/2.35/1.86 |  |

Wall is this run's last step end minus its first step start; steps sum to 45m52s.

Exec turns took 33m47s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

CI wait: 4m43s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m09s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a002f66847a2486a2 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.00/5.00/1.00 | 5.2K | 54.5K | 60.9K | 0.875 | claude-sonnet-5-5 |  |
| agent-a0e579734c67ecad7 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 5.00/3.00/1.67 | 4.2K | 56.8K | 63.6K | 0.873 | claude-sonnet-5-5 |  |
| agent-a0faba4fbaf0589fb | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 0/1/5 | n/a/2.00/3.00 | 5.6K | 53.1K | 59.3K | 0.875 | claude-fable-5-2 |  |
| agent-a13c63362295b196e | general-purpose | deliver | 5 | 3 | 4 | 2.0 | 0/0/0 | n/a/n/a/n/a | 2.6K | 31.5K | 36.2K | 0.617 | claude-opus-5-5 |  |
| agent-a1428584bd5062260 | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 1/1/2 | 7.00/3.00/2.00 | 4.9K | 48.3K | 52.9K | 0.781 | claude-fable-5-2 |  |
| agent-a19b668be391bb1f8 | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 3.00/2.00/1.50 | 2.9K | 43.1K | 48.3K | 0.776 | claude-fable-5-2 |  |
| agent-a1ab339d66798ccb0 | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 5.7K | 44.2K | 61.0K | 0.611 | claude-opus-5-5 |  |
| agent-a2790db24e82723a1 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/2.00/1.25 | 4.8K | 53.9K | 60.4K | 0.89 | claude-sonnet-5-5 |  |
| agent-a289b4fc9bcf88ba4 | mayker-dev:builder | deliver | 5 | 12 | 24 | 2.18 | 1/1/8 | 4.00/3.00/2.00 | 5.2K | 60.5K | 66.6K | 0.926 | claude-sonnet-5-5 |  |
| agent-a2ee89b244b9c6621 | mayker-dev:orchestrator | deliver | 5 | 8 | 19 | 2.71 | 0/1/6 | n/a/2.00/2.83 | 5.9K | 53.9K | 61.6K | 0.887 | claude-fable-5-2 |  |
| agent-a374e0f310c662a76 | mayker-dev:builder | deliver | 5 | 6 | 17 | 3.4 | 2/1/2 | 6.00/2.00/1.50 | 3.8K | 55.1K | 62.5K | 0.851 | claude-sonnet-5-5 |  |
| agent-a396d73d392399075 | mayker-dev:builder | deliver | 5 | 12 | 33 | 3.0 | 1/2/8 | 4.00/5.00/2.38 | 9.0K | 71.4K | 83.2K | 0.918 | claude-sonnet-5-5 |  |
| agent-a3d520f363a7604f6 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 6.2K | 48.6K | 62.5K | 0.678 | claude-opus-5-5 |  |
| agent-a3f505ad027a27356 | mayker-dev:planner | deliver | 5 | 13 | 35 | 2.92 | 1/1/9 | 1.00/2.00/3.00 | 16.2K | 80.7K | 103.7K | 0.914 | claude-opus-5-5 |  |
| agent-a40dc1915c4fa3d80 | mayker-dev:planner | deliver | 5 | 12 | 41 | 3.73 | 1/1/9 | 5.00/2.00/3.78 | 20.9K | 81.3K | 107.1K | 0.904 | claude-opus-5-5 |  |
| agent-a44247815fb3306f7 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 827 | 44.3K | 54.1K | 0.692 | claude-sonnet-5-5 |  |
| agent-a5b5d35a3852f70f9 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 836 | 44.2K | 54.0K | 0.692 | claude-sonnet-5-5 |  |
| agent-a613215bcac8c7828 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.9K | 51.3K | 67.5K | 0.671 | claude-opus-5-5 |  |
| agent-a6835780f6060f6e4 | mayker-dev:orchestrator | deliver | 8 | 4 | 8 | 2.67 | 1/0/2 | 6.00/n/a/1.00 | 6.8K | 54.0K | 60.4K | 0.786 | claude-fable-5-2 |  |
| agent-a693c4c06539f7164 | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 2/2/7 | 7.50/2.00/2.29 | 16.1K | 81.7K | 100.8K | 0.897 | claude-opus-5-5 |  |
| agent-a79372f439b5fc9c0 | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 0/2/4 | n/a/2.00/2.25 | 5.8K | 73.2K | 87.7K | 0.874 | claude-fable-5-2 |  |
| agent-a7c730111744931ac | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 792 | 39.3K | 46.7K | 0.716 | claude-sonnet-5-5 |  |
| agent-a89e3ebf91bc5db6b | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 1/2/3 | 5.00/3.00/1.00 | 5.6K | 54.4K | 60.9K | 0.84 | claude-sonnet-5-5 |  |
| agent-a8bc27a367b1a2e1c | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 2/1/1 | 5.00/2.00/1.00 | 2.7K | 50.5K | 57.0K | 0.826 | claude-sonnet-5-5 |  |
| agent-a8c9f983dedc8550e | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 6.50/1.00/1.00 | 3.6K | 55.3K | 63.0K | 0.85 | claude-sonnet-5-5 |  |
| agent-a8ec392949917d04d | mayker-dev:builder | deliver | 5 | 14 | 26 | 2.0 | 2/2/9 | 2.50/1.50/2.00 | 7.0K | 63.3K | 70.8K | 0.935 | claude-sonnet-5-5 |  |
| agent-a96f60665dab4b4c4 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/2/4 | 2.50/1.50/1.25 | 5.5K | 53.5K | 59.7K | 0.903 | claude-sonnet-5-5 |  |
| agent-a97ced5945a138984 | mayker-dev:planner | deliver | 5 | 9 | 30 | 3.75 | 1/1/6 | 7.00/2.00/3.50 | 11.9K | 81.4K | 103.8K | 0.858 | claude-opus-5-5 |  |
| agent-aae138dd1c4ca7a4e | mayker-dev:builder | deliver | 5 | 8 | 32 | 4.57 | 2/1/4 | 7.00/13.00/1.25 | 9.6K | 65.9K | 75.6K | 0.857 | claude-sonnet-5-5 |  |
| agent-aaf612a9aaf5db9fe | mayker-dev:builder | deliver | 5 | 8 | 18 | 2.57 | 2/3/2 | 4.50/2.33/1.00 | 5.2K | 56.1K | 62.9K | 0.889 | claude-sonnet-5-5 |  |
| agent-ab384ccf2e47cf0b5 | mayker-dev:orchestrator | deliver | 5 | 7 | 23 | 3.83 | 1/1/3 | 8.00/2.00/3.00 | 6.4K | 59.4K | 68.8K | 0.865 | claude-fable-5-2 |  |
| agent-ab6ba56e25c7e3d23 | mayker-dev:builder | deliver | 5 | 6 | 18 | 3.6 | 2/1/2 | 4.50/7.00/1.00 | 6.5K | 58.9K | 67.7K | 0.846 | claude-sonnet-5-5 |  |
| agent-ab7488e931809d9fe | mayker-dev:orchestrator | deliver | 5 | 10 | 26 | 2.89 | 0/2/6 | n/a/1.00/3.17 | 9.0K | 95.8K | 113.8K | 0.896 | claude-fable-5-2 |  |
| agent-abd573b5584c81daa | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 7.00/1.00/3.00 | 4.7K | 54.6K | 62.5K | 0.809 | claude-fable-5-2 |  |
| agent-ac047992e8fe7ca1e | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 1/1/3 | 4.00/2.00/1.33 | 2.7K | 46.0K | 52.3K | 0.811 | claude-fable-5-2 |  |
| agent-ad0b06b2ee9652550 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 726 | 39.2K | 46.0K | 0.581 | claude-sonnet-5-5 |  |
| agent-ada3ce4577595d2aa | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 3.00/2.00/1.00 | 4.5K | 53.8K | 59.6K | 0.892 | claude-sonnet-5-5 |  |
| agent-adb389616f3aed62a | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 1/1/4 | 4.00/2.00/1.00 | 3.0K | 50.0K | 54.2K | 0.883 | claude-sonnet-5-5 |  |
| agent-ae0aa9efb305e9367 | mayker-dev:planner | deliver | 5 | 15 | 39 | 2.79 | 3/1/9 | 1.00/2.00/3.22 | 19.2K | 83.3K | 107.1K | 0.925 | claude-opus-5-5 |  |
| agent-ae181ef17f6af39fa | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 644 | 39.3K | 46.6K | 0.716 | claude-sonnet-5-5 |  |
| agent-ae8777704e675d08e | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 4.9K | 48.7K | 61.6K | 0.732 | claude-opus-5-5 |  |
| agent-aeb544768f530dd99 | mayker-dev:orchestrator | deliver | 3 | 9 | 19 | 2.38 | 1/2/5 | 4.00/1.00/2.60 | 9.7K | 71.6K | 85.6K | 0.867 | claude-fable-5-2 |  |
| agent-aeeb6611c3a840488 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 4.50/4.50/1.00 | 7.2K | 59.8K | 68.5K | 0.868 | claude-sonnet-5-5 |  |
| agent-af7bc3ff30db51e4b | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/1/6 | 2.00/2.00/1.33 | 5.9K | 58.3K | 65.4K | 0.91 | claude-sonnet-5-5 |  |
| agent-af9faf495f3b359bd | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 1/1/2 | 8.00/2.00/2.00 | 4.8K | 48.6K | 55.1K | 0.773 | claude-fable-5-2 |  |
| agent-afe6df8a33409878e | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.8K | 52.6K | 71.7K | 0.704 | claude-opus-5-5 |  |
| agent-afed99a7111a3c7eb | general-purpose | deliver | 5 | 5 | 6 | 1.5 | 0/0/0 | n/a/n/a/n/a | 1.3K | 43.8K | 58.2K | 0.734 | claude-opus-5-5 |  |

**47 dispatch(es)** in `deliver` (general-purpose 2, mayker-dev:builder 23, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 62.5K, peak 113.8K, 0 above the auto threshold (80% of the serving model's window). Distribution: 36.2K, 46.0K, 46.6K, 46.7K, 48.3K, 52.3K, 52.9K, 54.0K, 54.1K, 54.2K, 55.1K, 57.0K, 58.2K, 59.3K, 59.6K, 59.7K, 60.4K, 60.4K, 60.9K, 60.9K, 61.0K, 61.6K, 61.6K, 62.5K, 62.5K, 62.5K, 62.9K, 63.0K, 63.6K, 65.4K, 66.6K, 67.5K, 67.7K, 68.5K, 68.8K, 70.8K, 71.7K, 75.6K, 83.2K, 85.6K, 87.7K, 100.8K, 103.7K, 103.8K, 107.1K, 107.1K, 113.8K.

**All runs:** 1 run(s), wall 45m53s (sum of per-run walls, idle time between runs excluded), 537 turns, 1079 tool calls, 410.0K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 74/66/279 turns, 4.35/2.35/1.86 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m47s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

All runs: CI wait: 4m43s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m09s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
