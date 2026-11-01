# Run statistics, run

Generated 2026-11-01 07:13 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 48 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 5m17s | 14 | 37 | 2.85 | 7 | 25.8K | 107.2K | 146.7K | 0 | 0.89 | claude-fable-5-1 | 1/3/8 | 4.00/1.67/3.38 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 5m17s | 14 | 37 | 2.85 | 7 | 25.8K | 107.2K | 146.7K | 0 | 0.89 | claude-fable-5-1 | 1/3/8 | 4.00/1.67/3.38 |  |
| 5 | Scheduler loop | 42m51s | 511 | 1046 | 2.36 | 15 | 398.3K | 141.5K | 451.3K | 0 | 0.957 | claude-opus-5-5 | 83/64/265 | 4.47/2.44/1.69 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at the final boundary | 1m58s | 10 | 19 | 2.11 | 4 | 9.9K | 146.5K | 449.2K | 0 | 0.93 | claude-fable-5-1 | 1/2/4 | 4.00/2.00/2.00 |  |
| 8 | Final report | 3m45s | 9 | 12 | 1.71 | 5 | 25.0K | 195.8K | 472.5K | 0 | 0.954 | claude-fable-5-1 | 3/1/2 | 1.00/2.00/3.00 |  |
| **run total** |  | 51m53s | 534 | 1095 | 2.37 | 15 | 449.1K |  | 472.5K |  | 0.955 | claude-opus-5-5 | 87/68/275 (exec 74% of wall) | 4.34/2.40/1.75 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m53s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 38m11s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

CI wait: 10m05s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m47s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a093971a39efc9b2d | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/1/4 | 3.50/5.00/1.00 | 6.1K | 58.2K | 64.4K | 0.89 | claude-sonnet-5-5 |  |
| agent-a17bf1a8b28aabcf4 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 480 | 36.3K | 37.9K | 0.661 | claude-sonnet-5-5 |  |
| agent-a1a3f555eaadb21fe | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 482 | 38.8K | 43.0K | 0.618 | claude-sonnet-5-5 |  |
| agent-a1d3d84fb368c63e8 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 3.6K | 47.2K | 52.2K | 0.815 | claude-fable-5-1 |  |
| agent-a2748daac4fa67af5 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 2/1/3 | 4.00/1.00/1.00 | 3.0K | 65.6K | 73.1K | 0.87 | claude-sonnet-5-5 |  |
| agent-a2a96b23ff7dc5cf7 | mayker-dev:planner | deliver | 5 | 11 | 31 | 3.1 | 2/1/7 | 4.50/2.00/2.86 | 15.0K | 94.3K | 116.7K | 0.887 | claude-opus-5-5 |  |
| agent-a2b0cb11dea75641d | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 1/0/1 | 3.00/n/a/2.00 | 1.1K | 44.1K | 52.1K | 0.707 | claude-sonnet-5-5 |  |
| agent-a2dfff6c795b53d92 | mayker-dev:planner | deliver | 5 | 13 | 35 | 2.92 | 1/2/8 | 6.00/1.50/2.50 | 13.2K | 104.3K | 126.1K | 0.917 | claude-opus-5-5 |  |
| agent-a36a72ef92557938e | mayker-dev:orchestrator | deliver | 5 | 8 | 15 | 2.14 | 1/1/5 | 7.00/1.00/1.40 | 5.1K | 50.2K | 55.3K | 0.894 | claude-fable-5-1 |  |
| agent-a3a289734efaa1dc3 | mayker-dev:planner | deliver | 5 | 10 | 26 | 2.89 | 1/1/6 | 6.00/2.00/1.83 | 12.3K | 94.8K | 114.5K | 0.879 | claude-opus-5-5 |  |
| agent-a4188382d445d4365 | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 5.3K | 47.0K | 64.7K | 0.607 | claude-opus-5-5 |  |
| agent-a419ceca306e2f1fd | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/2/2 | 5.50/1.00/1.00 | 3.6K | 56.3K | 62.4K | 0.875 | claude-sonnet-5-5 |  |
| agent-a423f2c4f60850e2e | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 0/1/4 | n/a/1.00/2.25 | 2.0K | 40.2K | 42.4K | 0.879 | claude-sonnet-5-5 |  |
| agent-a448bc4d81bc0785c | mayker-dev:planner | deliver | 5 | 11 | 34 | 3.4 | 1/1/7 | 6.00/2.00/2.57 | 18.8K | 106.9K | 135.4K | 0.896 | claude-opus-5-5 |  |
| agent-a47329267dba6aacd | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 1/3/3 | 6.00/2.67/1.00 | 4.6K | 63.8K | 70.4K | 0.888 | claude-sonnet-5-5 |  |
| agent-a489e91bb9239d40c | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.50/2.00/1.50 | 4.8K | 53.0K | 59.5K | 0.891 | claude-sonnet-5-5 |  |
| agent-a4b501b68e50bb00b | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.00/1.00/1.50 | 4.5K | 47.2K | 52.6K | 0.814 | claude-fable-5-1 |  |
| agent-a548edc3375c7ffc9 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 6.2K | 52.1K | 67.0K | 0.679 | claude-opus-5-5 |  |
| agent-a572962856a1a1e2f | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 6.00/1.00/1.00 | 3.4K | 64.0K | 71.1K | 0.871 | claude-sonnet-5-5 |  |
| agent-a58223c2e98a19e5e | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 2.50/1.50/1.20 | 7.0K | 65.2K | 73.8K | 0.907 | claude-sonnet-5-5 |  |
| agent-a587cd4213c11d859 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/2/3 | 3.50/3.00/1.33 | 5.2K | 66.1K | 75.6K | 0.882 | claude-sonnet-5-5 |  |
| agent-a66a2526fb74992c4 | mayker-dev:orchestrator | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 3.00/1.00/1.25 | 5.0K | 48.4K | 53.9K | 0.894 | claude-fable-5-1 |  |
| agent-a680d231a0f26ab97 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 4.00/2.00/1.00 | 5.9K | 50.5K | 56.3K | 0.877 | claude-fable-5-1 |  |
| agent-a6b696fdf003c163d | mayker-dev:builder | deliver | 5 | 10 | 15 | 1.67 | 2/2/5 | 3.00/1.50/1.20 | 5.9K | 56.3K | 63.4K | 0.911 | claude-sonnet-5-5 |  |
| agent-a6cf7713110835b5d | mayker-dev:builder | deliver | 5 | 12 | 20 | 1.82 | 2/1/7 | 3.00/2.00/1.57 | 5.0K | 66.2K | 72.5K | 0.926 | claude-sonnet-5-5 |  |
| agent-a71bcee44601793ab | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 7.00/1.00/1.67 | 4.6K | 48.4K | 53.1K | 0.817 | claude-fable-5-1 |  |
| agent-a775f86bf91081694 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 4.8K | 45.0K | 60.1K | 0.555 | claude-opus-5-5 |  |
| agent-a8396d8b47190925e | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 3.9K | 47.2K | 52.1K | 0.861 | claude-fable-5-1 |  |
| agent-a8a910373bdc546d5 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 4.4K | 50.2K | 55.9K | 0.857 | claude-fable-5-1 |  |
| agent-a8e5ae9618b40cb8e | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 7.00/2.00/2.67 | 4.8K | 50.2K | 55.2K | 0.859 | claude-fable-5-1 |  |
| agent-a92ba4584cef6aa49 | mayker-dev:reviewer | deliver | 5 | 5 | 24 | 6.0 | 4/0/0 | 6.00/n/a/n/a | 6.7K | 55.1K | 68.7K | 0.751 | claude-opus-5-5 |  |
| agent-a94606f3ce5d922a4 | mayker-dev:orchestrator | deliver | 5 | 8 | 15 | 2.14 | 1/1/4 | 4.00/2.00/2.00 | 8.2K | 72.0K | 91.9K | 0.84 | claude-fable-5-1 |  |
| agent-a972536b229f86485 | mayker-dev:builder | deliver | 5 | 14 | 26 | 2.0 | 1/1/10 | 3.00/2.00/2.00 | 6.7K | 66.9K | 74.7K | 0.934 | claude-sonnet-5-5 |  |
| agent-a97d20d6f9cd80384 | mayker-dev:planner | deliver | 5 | 11 | 41 | 4.1 | 1/1/7 | 4.00/2.00/3.57 | 22.4K | 98.6K | 127.4K | 0.895 | claude-opus-5-5 |  |
| agent-a981d868fddb67880 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 2.50/1.50/1.50 | 6.1K | 54.8K | 62.1K | 0.901 | claude-sonnet-5-5 |  |
| agent-a99bf3e733218e54e | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 4.5K | 52.5K | 57.4K | 0.858 | claude-fable-5-1 |  |
| agent-a9bb92f4d02036fb5 | mayker-dev:builder | deliver | 5 | 8 | 26 | 3.71 | 2/1/4 | 4.00/9.00/2.25 | 6.9K | 71.6K | 82.5K | 0.856 | claude-sonnet-5-5 |  |
| agent-aa1ba04d3e24cbede | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 0/0/3 | n/a/n/a/1.67 | 1.2K | 38.8K | 41.4K | 0.819 | claude-sonnet-5-5 |  |
| agent-ab985a8bf2e0b90bc | mayker-dev:builder | deliver | 5 | 6 | 33 | 6.6 | 2/2/1 | 7.50/8.50/1.00 | 8.6K | 70.8K | 85.6K | 0.83 | claude-sonnet-5-5 |  |
| agent-ab9de3802c6e44705 | mayker-dev:builder | deliver | 5 | 9 | 22 | 2.75 | 2/3/3 | 4.50/3.33/1.00 | 8.0K | 69.4K | 78.7K | 0.895 | claude-sonnet-5-5 |  |
| agent-ac5489faa9fb578db | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 7.00/1.00/2.00 | 6.7K | 53.7K | 60.1K | 0.853 | claude-fable-5-1 |  |
| agent-acabae38424457d3f | mayker-dev:orchestrator | deliver | 3 | 11 | 33 | 3.3 | 1/2/7 | 4.00/1.50/3.71 | 23.3K | 114.3K | 146.7K | 0.883 | claude-fable-5-1 |  |
| agent-ad39b56e3eedf5fd6 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 5.00/9.00/1.00 | 8.4K | 69.5K | 82.6K | 0.834 | claude-sonnet-5-5 |  |
| agent-ad8c541fc97e0e2a1 | mayker-dev:orchestrator | deliver | 8 | 6 | 8 | 2.0 | 3/0/1 | 1.00/n/a/5.00 | 15.5K | 61.4K | 74.6K | 0.836 | claude-fable-5-1 |  |
| agent-adfe78228a27d8e45 | mayker-dev:reviewer | deliver | 5 | 5 | 26 | 6.5 | 4/0/0 | 6.50/n/a/n/a | 6.8K | 58.2K | 71.0K | 0.756 | claude-opus-5-5 |  |
| agent-aeafbfb4ebb42853a | mayker-dev:builder | deliver | 5 | 17 | 31 | 1.94 | 2/1/12 | 1.50/3.00/2.00 | 7.0K | 72.7K | 81.1K | 0.945 | claude-sonnet-5-5 |  |
| agent-af65a4180abcfcb45 | mayker-dev:planner | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 4.50/2.00/1.50 | 13.9K | 66.9K | 78.8K | 0.836 | claude-opus-5-5 |  |
| agent-afc2684e0f818f95d | mayker-dev:builder | deliver | 5 | 6 | 18 | 3.6 | 2/1/2 | 5.50/4.00/1.50 | 3.7K | 53.9K | 60.2K | 0.855 | claude-sonnet-5-5 |  |

**48 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 14, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 65.9K, peak 146.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 37.9K, 41.4K, 42.4K, 43.0K, 52.1K, 52.1K, 52.2K, 52.6K, 53.1K, 53.9K, 55.2K, 55.3K, 55.9K, 56.3K, 57.4K, 59.5K, 60.1K, 60.1K, 60.2K, 62.1K, 62.4K, 63.4K, 64.4K, 64.7K, 67.0K, 68.7K, 70.4K, 71.0K, 71.1K, 72.5K, 73.1K, 73.8K, 74.6K, 74.7K, 75.6K, 78.7K, 78.8K, 81.1K, 82.5K, 82.6K, 85.6K, 91.9K, 114.5K, 116.7K, 126.1K, 127.4K, 135.4K, 146.7K.

**All runs:** 1 run(s), wall 51m53s (sum of per-run walls, idle time between runs excluded), 534 turns, 1095 tool calls, 449.1K output tokens, cache hit 0.955.

Turn classes across every bucket, read / edit / exec: 87/68/275 turns, 4.34/2.40/1.75 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 38m11s of round trip (command plus model time, ADR 0006 section 2): 74% of wall.

All runs: CI wait: 10m05s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m47s.

10 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 3/0/7).
