# Run statistics, run

Generated 2026-10-22 19:18 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 48 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 2m49s | 12 | 22 | 2.0 | 4 | 14.2K | 75.7K | 92.4K | 0 | 0.88 | claude-fable-5-1 | 1/2/7 | 4.00/2.00/1.86 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 2m49s | 12 | 22 | 2.0 | 4 | 14.2K | 75.7K | 92.4K | 0 | 0.88 | claude-fable-5-1 | 1/2/7 | 4.00/2.00/1.86 |  |
| 5 | Scheduler loop | 1h14m | 595 | 1081 | 2.06 | 14 | 423.5K | 157.5K | 464.4K | 0 | 0.967 | claude-opus-5-5 | 85/79/326 | 3.87/2.28/1.60 |  |
| 5.orchestrator (in 5) | Wave 2 boundary re-ingest | 27m40s | 252 | 447 | 2.04 | 11 | 183.8K | 185.8K | 461.7K | 1 | 0.971 | claude-opus-5-5 | 35/36/131 | 4.14/2.33/1.53 |  |
| 8 | Final report | 4m32s | 10 | 12 | 1.33 | 3 | 29.2K | 225.7K | 485.8K | 0 | 0.964 | claude-fable-5-1 | 1/2/5 | 3.00/1.50/1.00 |  |
| **run total** |  | 1h21m | 617 | 1115 | 2.04 | 14 | 466.9K |  | 485.8K |  | 0.966 | claude-opus-5-5 | 87/83/338 (exec 86% of wall) | 3.86/2.25/1.60 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h21m.

Nested sub-span(s) `3.orchestrator (in 3)`, `5.orchestrator (in 5)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 1h10m of round trip (command plus model time, ADR 0006 section 2): 86% of wall.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a067279c7dddaa014 | mayker-dev:builder | deliver | 5 | 11 | 18 | 1.8 | 2/2/6 | 5.00/1.00/1.00 | 4.4K | 57.6K | 62.8K | 0.922 | claude-sonnet-5-5 |  |
| agent-a085be324edfb170c | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 513 | 36.4K | 38.5K | 0.652 | claude-sonnet-5-5 |  |
| agent-a0da9349f592e2a97 | mayker-dev:planner | deliver | 5 | 11 | 30 | 3.0 | 1/1/8 | 10.00/2.00/2.25 | 17.4K | 100.3K | 121.3K | 0.902 | claude-opus-5-5 |  |
| agent-a1077fd5d0baf18ae | mayker-dev:reviewer | deliver | 5 | 5 | 23 | 5.75 | 4/0/0 | 5.75/n/a/n/a | 6.9K | 59.4K | 75.4K | 0.777 | claude-opus-5-5 |  |
| agent-a144a03deecc39691 | mayker-dev:orchestrator | deliver | 8 | 6 | 7 | 1.4 | 1/1/3 | 3.00/1.00/1.00 | 18.1K | 59.5K | 73.8K | 0.831 | claude-fable-5-1 |  |
| agent-a1812ff85b1b15af5 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 0/1/5 | n/a/1.00/3.00 | 4.1K | 52.0K | 59.7K | 0.835 | claude-fable-5-1 |  |
| agent-a18371736a1df8920 | mayker-dev:builder | deliver | 5 | 10 | 15 | 1.67 | 2/1/6 | 2.50/2.00/1.33 | 6.7K | 58.4K | 66.3K | 0.909 | claude-sonnet-5-5 |  |
| agent-a19640e2bfc16d0da | mayker-dev:reviewer | deliver | 5 | 6 | 29 | 5.8 | 5/0/0 | 5.80/n/a/n/a | 9.5K | 58.1K | 75.5K | 0.81 | claude-opus-5-5 |  |
| agent-a1b2c74d3d8833263 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/1/5 | 2.00/5.00/1.00 | 6.1K | 48.9K | 53.5K | 0.908 | claude-sonnet-5-5 |  |
| agent-a206f781e02bedff0 | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 1/2/3 | 5.00/4.50/1.00 | 5.1K | 53.8K | 60.1K | 0.84 | claude-sonnet-5-5 |  |
| agent-a23112528e9c6a061 | mayker-dev:orchestrator | deliver | 5 | 10 | 17 | 1.89 | 3/1/5 | 3.67/1.00/1.00 | 5.0K | 49.0K | 54.4K | 0.888 | claude-fable-5-1 |  |
| agent-a25990bb776b1d2b0 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.00/2.00/1.00 | 2.2K | 49.2K | 53.8K | 0.862 | claude-sonnet-5-5 |  |
| agent-a272ae18e2231a6e0 | mayker-dev:orchestrator | deliver | 3 | 9 | 18 | 2.25 | 1/1/6 | 4.00/2.00/2.00 | 12.2K | 74.8K | 92.4K | 0.862 | claude-fable-5-1 |  |
| agent-a30abf60e42be4c18 | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.0 | 1/1/5 | 4.00/2.00/1.60 | 8.7K | 66.4K | 81.3K | 0.847 | claude-fable-5-1 |  |
| agent-a3a30884f0a27bf85 | mayker-dev:builder | deliver | 5 | 11 | 24 | 2.4 | 1/1/7 | 4.00/5.00/2.00 | 4.8K | 64.9K | 71.1K | 0.919 | claude-sonnet-5-5 |  |
| agent-a3ad0c1e75df68f01 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.00/2.00/1.00 | 3.0K | 52.8K | 59.9K | 0.852 | claude-sonnet-5-5 |  |
| agent-a3fbadeef9919df08 | mayker-dev:planner | deliver | 5 | 12 | 26 | 2.36 | 2/2/7 | 6.00/1.50/1.57 | 11.8K | 89.8K | 105.8K | 0.902 | claude-opus-5-5 |  |
| agent-a4dccf93a60119056 | mayker-dev:reviewer | deliver | 5 | 5 | 16 | 4.0 | 4/0/0 | 4.00/n/a/n/a | 5.5K | 52.1K | 63.0K | 0.758 | claude-opus-5-5 |  |
| agent-a686ef16c8dc0790a | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 4.50/1.00/1.00 | 5.8K | 51.8K | 57.2K | 0.856 | claude-fable-5-1 |  |
| agent-a7916ab573b660904 | mayker-dev:planner | deliver | 5 | 11 | 33 | 3.3 | 0/2/8 | n/a/1.50/3.75 | 17.5K | 99.9K | 119.9K | 0.902 | claude-opus-5-5 |  |
| agent-a7a7ed7d92f0393df | mayker-dev:builder | deliver | 5 | 9 | 33 | 4.12 | 1/1/6 | 5.00/13.00/2.50 | 9.6K | 71.4K | 80.4K | 0.895 | claude-sonnet-5-5 |  |
| agent-a7bb3afc7d5843e4b | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 4.00/1.00/2.00 | 3.8K | 47.2K | 53.0K | 0.812 | claude-fable-5-1 |  |
| agent-a83b356f61f7cdf53 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 3/1/1 | 3.00/2.00/5.00 | 4.7K | 48.8K | 54.0K | 0.858 | claude-fable-5-1 |  |
| agent-a872021514506200e | mayker-dev:reviewer | deliver | 5 | 5 | 21 | 5.25 | 4/0/0 | 5.25/n/a/n/a | 5.8K | 61.1K | 77.3K | 0.747 | claude-opus-5-5 |  |
| agent-a9c54d4e9bf7682fa | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 4.50/2.00/2.00 | 12.5K | 65.2K | 79.0K | 0.827 | claude-fable-5-1 |  |
| agent-aa7e70865b897863a | mayker-dev:builder | deliver | 5 | 5 | 6 | 1.5 | 0/1/3 | n/a/1.00/1.67 | 1.7K | 39.6K | 42.3K | 0.853 | claude-sonnet-5-5 |  |
| agent-aac5a97b2c98e6d4f | mayker-dev:builder | deliver | 5 | 10 | 16 | 1.78 | 2/2/5 | 3.00/1.50/1.40 | 6.2K | 62.2K | 70.0K | 0.909 | claude-sonnet-5-5 |  |
| agent-aad8585a184a48ea2 | mayker-dev:builder | deliver | 5 | 8 | 10 | 1.43 | 2/1/4 | 2.00/2.00/1.00 | 4.9K | 44.9K | 49.7K | 0.898 | claude-sonnet-5-5 |  |
| agent-ab24ba7a7cd399954 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 793 | 37.2K | 39.1K | 0.768 | claude-sonnet-5-5 |  |
| agent-ab969a9780c5afbce | mayker-dev:planner | deliver | 5 | 12 | 28 | 2.55 | 0/2/9 | n/a/1.50/2.78 | 17.2K | 98.9K | 119.5K | 0.899 | claude-opus-5-5 |  |
| agent-abe0f7524ef685273 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.50/1.50/1.00 | 5.7K | 52.8K | 58.4K | 0.905 | claude-sonnet-5-5 |  |
| agent-abecc2435e9db3f0f | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 3.50/3.00/1.00 | 2.8K | 57.0K | 63.1K | 0.815 | claude-sonnet-5-5 |  |
| agent-ac062b46319a52e96 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 0/0/3 | n/a/n/a/2.00 | 1.7K | 42.4K | 50.9K | 0.778 | claude-sonnet-5-5 |  |
| agent-ac3cf8fd9fb21c584 | mayker-dev:reviewer | deliver | 5 | 4 | 11 | 3.67 | 3/0/0 | 3.67/n/a/n/a | 3.8K | 43.8K | 53.3K | 0.748 | claude-opus-5-5 |  |
| agent-ac8d4004f6251fd9f | mayker-dev:builder | deliver | 5 | 5 | 5 | 1.25 | 0/1/3 | n/a/1.00/1.33 | 1.5K | 39.5K | 41.7K | 0.855 | claude-sonnet-5-5 |  |
| agent-ac994b8322eee89ec | mayker-dev:planner | deliver | 5 | 9 | 22 | 2.75 | 1/2/5 | 7.00/1.50/2.40 | 9.6K | 86.7K | 103.8K | 0.883 | claude-opus-5-5 |  |
| agent-aca5cbb5d9bdb5696 | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.75 | 0/1/3 | n/a/1.00/3.33 | 4.3K | 46.7K | 54.2K | 0.768 | claude-fable-5-1 |  |
| agent-acd9f8f07da4f59af | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 1/1/4 | 4.00/1.00/1.75 | 4.0K | 47.4K | 52.0K | 0.843 | claude-fable-5-1 |  |
| agent-ad21ed06afba73b73 | mayker-dev:builder | deliver | 5 | 15 | 28 | 2.0 | 3/1/10 | 2.67/2.00/1.80 | 7.8K | 71.1K | 80.5K | 0.937 | claude-sonnet-5-5 |  |
| agent-ad4a7af003a0b508b | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.50/1.00/2.00 | 7.0K | 59.4K | 67.7K | 0.867 | claude-fable-5-1 |  |
| agent-ad6e0f28812b2a3a1 | mayker-dev:builder | deliver | 5 | 6 | 22 | 4.4 | 2/1/2 | 4.50/11.00/1.00 | 7.5K | 64.5K | 75.1K | 0.84 | claude-sonnet-5-5 |  |
| agent-adb926a192bd9e688 | mayker-dev:reviewer | deliver | 5 | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 3.8K | 45.3K | 54.3K | 0.701 | claude-opus-5-5 |  |
| agent-adc732ede69787219 | mayker-dev:builder | deliver | 5 | 13 | 27 | 2.25 | 1/4/7 | 3.00/2.50/2.00 | 7.1K | 58.3K | 64.3K | 0.932 | claude-sonnet-5-5 |  |
| agent-ae22f6119d588221b | mayker-dev:builder | deliver | 5 | 16 | 23 | 1.53 | 2/1/11 | 2.00/3.00/1.36 | 5.6K | 65.5K | 73.0K | 0.943 | claude-sonnet-5-5 |  |
| agent-ae4acc0ad47585761 | mayker-dev:builder | deliver | 5 | 6 | 17 | 3.4 | 2/2/1 | 3.50/4.50/1.00 | 5.2K | 54.6K | 63.1K | 0.848 | claude-sonnet-5-5 |  |
| agent-ae95bdbe3fa3f745d | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 3.00/1.00/3.25 | 4.9K | 50.5K | 58.3K | 0.834 | claude-fable-5-1 |  |
| agent-af818061a815fad98 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 4.50/10.00/1.00 | 7.8K | 64.7K | 75.2K | 0.84 | claude-sonnet-5-5 |  |
| agent-aff41c4c2b3734382 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 7.00/1.00/1.75 | 5.8K | 50.1K | 55.8K | 0.84 | claude-fable-5-1 |  |

**48 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 6): median ctx max 63.0K, peak 121.3K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.5K, 39.1K, 41.7K, 42.3K, 49.7K, 50.9K, 52.0K, 53.0K, 53.3K, 53.5K, 53.8K, 54.0K, 54.2K, 54.3K, 54.4K, 55.8K, 57.2K, 58.3K, 58.4K, 59.7K, 59.9K, 60.1K, 62.8K, 63.0K, 63.1K, 63.1K, 64.3K, 66.3K, 67.7K, 70.0K, 71.1K, 73.0K, 73.8K, 75.1K, 75.2K, 75.4K, 75.5K, 77.3K, 79.0K, 80.4K, 80.5K, 81.3K, 92.4K, 103.8K, 105.8K, 119.5K, 119.9K, 121.3K.

**All runs:** 1 run(s), wall 1h21m (sum of per-run walls, idle time between runs excluded), 617 turns, 1115 tool calls, 466.9K output tokens, cache hit 0.966.

Turn classes across every bucket, read / edit / exec: 87/83/338 turns, 3.86/2.25/1.60 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 1h10m of round trip (command plus model time, ADR 0006 section 2): 86% of wall.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/8).
