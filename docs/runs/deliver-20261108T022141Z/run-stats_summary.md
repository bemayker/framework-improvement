# Run statistics, run

Generated 2026-11-08 03:08 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 46m47s | 553 | 1060 | 2.19 | 13 | 415.1K |  | 514.0K |  | 0.963 | claude-opus-5-5 | 80/81/279 (exec 76% of wall) | 4.03/2.28/1.71 |  |

Wall is this run's last step end minus its first step start; steps sum to 46m46s.

Exec turns took 35m42s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

CI wait: 6m52s in `ci-poll.sh` calls; framework wall (wall less CI wait) 39m54s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a00fe0efe757bc3c7 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.00/2.00/1.00 | 3.2K | 46.8K | 52.5K | 0.829 | claude-fable-5-1 |  |
| agent-a0357b0562b24fbcd | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 3/1/1 | 3.00/2.00/1.00 | 2.6K | 49.8K | 59.4K | 0.845 | claude-sonnet-5-5 |  |
| agent-a0b9823f40c3320d1 | mayker-dev:orchestrator | deliver | 5 | 7 | 22 | 3.67 | 1/1/4 | 8.00/1.00/3.25 | 6.5K | 57.9K | 64.4K | 0.872 | claude-fable-5-1 |  |
| agent-a152ab56cda9ebfb1 | mayker-dev:orchestrator | deliver | 5 | 8 | 21 | 3.0 | 1/2/4 | 4.00/2.50/3.00 | 11.3K | 79.9K | 101.6K | 0.841 | claude-fable-5-1 |  |
| agent-a1d3ffb6c6e764c83 | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 1/0/2 | 2.00/n/a/1.00 | 1.1K | 42.4K | 45.8K | 0.807 | claude-sonnet-5-5 |  |
| agent-a1e7f464dfe9a82d6 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 5.00/9.00/1.00 | 7.9K | 61.9K | 72.2K | 0.84 | claude-sonnet-5-5 |  |
| agent-a1f023c7d059123d7 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 46.6K | 60.1K | 0.747 | claude-sonnet-5-5 |  |
| agent-a20e44ab21ff5356b | mayker-dev:reviewer | deliver | 5 | 6 | 25 | 5.0 | 5/0/0 | 5.00/n/a/n/a | 6.8K | 58.4K | 73.4K | 0.817 | claude-opus-5-5 |  |
| agent-a28eb132f96a1cf4d | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 570 | 41.2K | 48.3K | 0.572 | claude-sonnet-5-5 |  |
| agent-a2ebb794da8b47bb3 | mayker-dev:planner | deliver | 5 | 12 | 31 | 2.82 | 0/3/7 | n/a/2.00/2.71 | 16.4K | 77.2K | 95.6K | 0.911 | claude-opus-5-5 |  |
| agent-a36afacd4c91c7fb5 | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.3K | 48.6K | 55.4K | 0.826 | claude-sonnet-5-5 |  |
| agent-a37088f6a603efd50 | mayker-dev:builder | deliver | 5 | 6 | 22 | 4.4 | 2/1/2 | 5.00/10.00/1.00 | 7.6K | 61.0K | 70.6K | 0.842 | claude-sonnet-5-5 |  |
| agent-a389d7f68b3945e88 | mayker-dev:builder | deliver | 5 | 14 | 20 | 1.54 | 2/1/9 | 2.50/2.00/1.33 | 4.6K | 59.9K | 65.3K | 0.937 | claude-sonnet-5-5 |  |
| agent-a4604ebece071435e | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 5.00/1.00/1.00 | 3.4K | 46.0K | 49.6K | 0.784 | claude-fable-5-1 |  |
| agent-a498ac1a617f768c0 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 4.0K | 47.6K | 52.6K | 0.816 | claude-fable-5-1 |  |
| agent-a4adbb44975e52e7d | mayker-dev:builder | deliver | 5 | 7 | 33 | 5.5 | 2/2/2 | 7.00/8.50/1.00 | 9.4K | 63.5K | 74.2K | 0.862 | claude-sonnet-5-5 |  |
| agent-a4f6d79190cce154e | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 2.5K | 47.2K | 53.6K | 0.856 | claude-sonnet-5-5 |  |
| agent-a56be9b5c5a4d4633 | mayker-dev:builder | deliver | 5 | 14 | 25 | 1.92 | 3/2/8 | 2.33/2.50/1.62 | 6.0K | 63.9K | 70.7K | 0.935 | claude-sonnet-5-5 |  |
| agent-a57aabe95c6ca040e | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 9.00/1.00/1.00 | 7.1K | 61.9K | 69.9K | 0.846 | claude-fable-5-1 |  |
| agent-a5c07092e4c22b8e5 | mayker-dev:orchestrator | deliver | 8 | 5 | 12 | 3.0 | 2/0/2 | 2.50/n/a/3.50 | 13.5K | 58.6K | 72.9K | 0.8 | claude-fable-5-1 |  |
| agent-a69ae864d8cd38135 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/1/3 | 2.50/9.00/2.67 | 6.4K | 57.9K | 66.1K | 0.837 | claude-sonnet-5-5 |  |
| agent-a6a4ea539d0dfc2cc | mayker-dev:planner | deliver | 5 | 15 | 36 | 2.57 | 1/2/11 | 2.00/1.50/2.82 | 13.2K | 75.0K | 93.3K | 0.929 | claude-opus-5-5 |  |
| agent-a6c759e9435693399 | mayker-dev:builder | deliver | 5 | 17 | 31 | 1.94 | 2/1/12 | 2.50/2.00/1.92 | 7.2K | 65.7K | 73.8K | 0.945 | claude-sonnet-5-5 |  |
| agent-a70f78f19330a8c8a | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 1/1/5 | 3.00/5.00/1.60 | 6.3K | 59.0K | 68.2K | 0.883 | claude-sonnet-5-5 |  |
| agent-a7ca1513d97d1d3c1 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 1/1/5 | 3.00/2.00/1.60 | 4.6K | 48.9K | 56.9K | 0.888 | claude-sonnet-5-5 |  |
| agent-a7df397f42c364ecf | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.0K | 47.7K | 66.5K | 0.601 | claude-opus-5-5 |  |
| agent-a82829208cdfda785 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 4.00/1.00/2.25 | 3.8K | 50.3K | 56.4K | 0.875 | claude-fable-5-1 |  |
| agent-a8667bd9573f73a83 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 7.00/1.00/1.50 | 6.6K | 53.0K | 59.3K | 0.874 | claude-fable-5-1 |  |
| agent-a87c38cc4c201eaf4 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.1K | 48.3K | 66.4K | 0.632 | claude-sonnet-5-5 |  |
| agent-a89610e8c1daa8cb0 | mayker-dev:planner | deliver | 5 | 12 | 36 | 3.27 | 1/3/6 | 4.00/1.33/3.50 | 18.0K | 76.0K | 94.6K | 0.91 | claude-opus-5-5 |  |
| agent-a8c1fd84e7170d027 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 5.00/4.00/1.00 | 4.6K | 55.3K | 61.1K | 0.842 | claude-sonnet-5-5 |  |
| agent-a98b068c36b87bdd9 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 4.3K | 49.9K | 64.6K | 0.676 | claude-opus-5-5 |  |
| agent-aa77a2f7800e9eef0 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 1/1/4 | 4.00/1.00/2.00 | 4.7K | 49.6K | 55.4K | 0.877 | claude-fable-5-1 |  |
| agent-ac84b8827ba7913ec | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 46.8K | 60.7K | 0.745 | claude-sonnet-5-5 |  |
| agent-ad40bbf8b41e75213 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.83 | 0/1/5 | n/a/2.00/1.80 | 5.8K | 49.1K | 56.3K | 0.89 | claude-sonnet-5-5 |  |
| agent-ad4b141cff8bc632a | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 7.00/1.00/1.67 | 5.4K | 51.1K | 57.7K | 0.853 | claude-fable-5-1 |  |
| agent-ad8f138685dbec11e | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 1/1/5 | 2.00/2.00/2.00 | 5.1K | 58.6K | 66.6K | 0.885 | claude-sonnet-5-5 |  |
| agent-adaae89a9222598fd | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 4.7K | 51.4K | 65.3K | 0.728 | claude-opus-5-5 |  |
| agent-ae34a87287bd3f580 | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 4.8K | 46.3K | 63.6K | 0.542 | claude-opus-5-5 |  |
| agent-aee6f11448c355358 | mayker-dev:planner | deliver | 5 | 11 | 26 | 2.6 | 2/1/7 | 5.50/2.00/1.86 | 14.2K | 76.1K | 96.8K | 0.884 | claude-opus-5-5 |  |
| agent-af21181c98a8827dc | mayker-dev:builder | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 2.00/2.00/1.67 | 3.6K | 52.5K | 60.1K | 0.851 | claude-sonnet-5-5 |  |
| agent-af281ee5060fb4be6 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 1/1/3 | 7.00/2.00/2.33 | 6.3K | 54.1K | 64.2K | 0.83 | claude-fable-5-1 |  |
| agent-af3edb22fb08da641 | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.50/1.00/1.00 | 2.2K | 51.9K | 59.1K | 0.822 | claude-sonnet-5-5 |  |
| agent-af433cf6a42067159 | mayker-dev:orchestrator | deliver | 3 | 9 | 19 | 2.38 | 1/2/5 | 4.00/2.00/2.20 | 12.8K | 76.5K | 95.6K | 0.861 | claude-fable-5-1 |  |
| agent-afa4d5a3d1f51adee | mayker-dev:planner | deliver | 5 | 13 | 35 | 2.92 | 1/1/9 | 4.00/2.00/2.33 | 17.0K | 77.6K | 101.0K | 0.9 | claude-opus-5-5 |  |
| agent-afcea7fb385ea9ae0 | mayker-dev:builder | deliver | 5 | 11 | 27 | 2.7 | 2/3/5 | 3.00/4.33/1.60 | 8.4K | 52.1K | 59.7K | 0.918 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 64.5K, peak 101.6K, 0 above the auto threshold (80% of the serving model's window). Distribution: 45.8K, 48.3K, 49.6K, 52.5K, 52.6K, 53.6K, 55.4K, 55.4K, 56.3K, 56.4K, 56.9K, 57.7K, 59.1K, 59.3K, 59.4K, 59.7K, 60.1K, 60.1K, 60.7K, 61.1K, 63.6K, 64.2K, 64.4K, 64.6K, 65.3K, 65.3K, 66.1K, 66.4K, 66.5K, 66.6K, 68.2K, 69.9K, 70.6K, 70.7K, 72.2K, 72.9K, 73.4K, 73.8K, 74.2K, 93.3K, 94.6K, 95.6K, 95.6K, 96.8K, 101.0K, 101.6K.

**All runs:** 1 run(s), wall 46m47s (sum of per-run walls, idle time between runs excluded), 553 turns, 1060 tool calls, 415.1K output tokens, cache hit 0.963.

Turn classes across every bucket, read / edit / exec: 80/81/279 turns, 4.03/2.28/1.71 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 35m42s of round trip (command plus model time, ADR 0006 section 2): 76% of wall.

All runs: CI wait: 6m52s in `ci-poll.sh` calls; framework wall (wall less CI wait) 39m54s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
