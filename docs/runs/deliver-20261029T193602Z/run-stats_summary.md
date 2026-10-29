# Run statistics, run

Generated 2026-10-29 20:27 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 4m05s | 9 | 22 | 2.75 | 6 | 19.0K | 84.3K | 112.9K | 0 | 0.823 | claude-fable-5-1 | 1/2/4 | 4.00/2.50/3.00 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 4m05s | 9 | 22 | 2.75 | 6 | 19.0K | 84.3K | 112.9K | 0 | 0.823 | claude-fable-5-1 | 1/2/4 | 4.00/2.50/3.00 |  |
| 5 | Scheduler loop | 43m11s | 547 | 998 | 2.1 | 13 | 397.0K | 144.6K | 450.1K | 0 | 0.963 | claude-opus-5-5 | 84/60/295 | 3.58/2.15/1.68 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at wave boundary | 3m02s | 11 | 22 | 2.2 | 6 | 13.1K | 206.8K | 440.1K | 0 | 0.954 | claude-fable-5-1 | 2/2/5 | 2.50/1.50/2.60 |  |
| 8 | Final report | 3m50s | 7 | 9 | 1.8 | 4 | 22.4K | 227.2K | 462.9K | 0 | 0.959 | claude-fable-5-1 | 0/1/3 | n/a/1.00/2.33 |  |
| **run total** |  | 51m06s | 563 | 1029 | 2.1 | 13 | 438.3K |  | 462.9K |  | 0.961 | claude-opus-5-5 | 85/63/302 (exec 88% of wall) | 3.59/2.14/1.71 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m06s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 45m03s of round trip (command plus model time, ADR 0006 section 2): 88% of wall.

CI wait: 7m59s in `ci-poll.sh` calls; framework wall (wall less CI wait) 43m06s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a057ef31ce3695b4d | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 1.00/n/a/2.00 | 785 | 37.3K | 39.3K | 0.768 | claude-sonnet-5-5 |  |
| agent-a14c2e47af27189d2 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 3.1K | 53.5K | 59.9K | 0.855 | claude-sonnet-5-5 |  |
| agent-a16753f30eabb7616 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 2.6K | 54.0K | 60.6K | 0.854 | claude-sonnet-5-5 |  |
| agent-a17f360323ae4ba7e | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 806 | 44.1K | 52.8K | 0.701 | claude-sonnet-5-5 |  |
| agent-a19ec03997e736f05 | mayker-dev:orchestrator | deliver | 5 | 9 | 14 | 2.0 | 1/1/5 | 4.00/1.00/1.80 | 7.0K | 55.5K | 65.3K | 0.894 | claude-fable-5-1 |  |
| agent-a2aac1254875e92f0 | mayker-dev:builder | deliver | 5 | 13 | 26 | 2.17 | 2/1/8 | 2.00/5.00/2.00 | 5.4K | 64.1K | 71.6K | 0.93 | claude-sonnet-5-5 |  |
| agent-a2e0893daa7e86e34 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 5.1K | 49.0K | 60.9K | 0.737 | claude-opus-5-5 |  |
| agent-a305d0259eccb5e4c | mayker-dev:orchestrator | deliver | 8 | 4 | 6 | 3.0 | 0/0/2 | n/a/n/a/3.00 | 13.3K | 55.4K | 66.0K | 0.765 | claude-fable-5-1 |  |
| agent-a34dbeea168802b5e | mayker-dev:builder | deliver | 5 | 7 | 9 | 1.5 | 1/1/4 | 1.00/1.00/1.75 | 2.4K | 40.6K | 43.1K | 0.895 | claude-sonnet-5-5 |  |
| agent-a37bae37aa69fc826 | mayker-dev:planner | deliver | 5 | 13 | 32 | 2.67 | 1/2/8 | 2.00/1.50/2.62 | 17.6K | 100.8K | 123.3K | 0.906 | claude-opus-5-5 |  |
| agent-a3d899853e491c56a | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 4.00/2.00/2.75 | 10.2K | 78.0K | 100.2K | 0.842 | claude-fable-5-1 |  |
| agent-a43e2ffd9f64d88da | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 2/2/2 | 3.50/1.50/1.00 | 2.8K | 52.6K | 57.6K | 0.88 | claude-sonnet-5-5 |  |
| agent-a49d03676a98ab85f | mayker-dev:builder | deliver | 5 | 22 | 38 | 1.81 | 2/1/17 | 1.50/2.00/1.88 | 9.4K | 65.9K | 78.6K | 0.955 | claude-sonnet-5-5 |  |
| agent-a4e5f1e1e9cd26331 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/2/2 | 4.50/5.00/1.00 | 7.8K | 68.8K | 78.6K | 0.864 | claude-sonnet-5-5 |  |
| agent-a57108f77b9db42f2 | mayker-dev:builder | deliver | 5 | 6 | 7 | 1.4 | 2/1/2 | 2.00/1.00/1.00 | 1.9K | 43.1K | 47.7K | 0.867 | claude-sonnet-5-5 |  |
| agent-a5a86dca3a91dce11 | mayker-dev:orchestrator | deliver | 5 | 8 | 8 | 1.33 | 2/1/3 | 2.00/1.00/1.00 | 5.6K | 44.3K | 49.3K | 0.897 | claude-fable-5-1 |  |
| agent-a5bf9e525ffb2f571 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 4.00/1.00/1.33 | 3.9K | 46.6K | 50.5K | 0.819 | claude-fable-5-1 |  |
| agent-a5db9f085809fea23 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 1/2/2 | 5.00/3.50/1.00 | 5.1K | 55.6K | 64.5K | 0.807 | claude-sonnet-5-5 |  |
| agent-a6537180b2c80f4ec | mayker-dev:planner | deliver | 5 | 13 | 35 | 2.92 | 2/2/7 | 5.50/1.50/2.29 | 29.2K | 106.3K | 138.9K | 0.909 | claude-opus-5-5 |  |
| agent-a68c235e390b699a4 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 5.00/1.00/1.67 | 6.7K | 63.2K | 70.1K | 0.87 | claude-fable-5-1 |  |
| agent-a6a649a5259163448 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/1/3 | 3.00/8.00/2.67 | 6.9K | 65.9K | 76.4K | 0.863 | claude-sonnet-5-5 |  |
| agent-a728c19a61dd6657a | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 1/3/4 | 4.00/4.67/1.50 | 9.2K | 69.8K | 79.4K | 0.873 | claude-sonnet-5-5 |  |
| agent-a7a56886a50ff7e7a | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 657 | 39.2K | 43.7K | 0.613 | claude-sonnet-5-5 |  |
| agent-a7f0a2c46fd9c2be0 | mayker-dev:builder | deliver | 5 | 6 | 26 | 5.2 | 1/1/3 | 3.00/13.00/3.33 | 7.1K | 63.9K | 75.4K | 0.838 | claude-sonnet-5-5 |  |
| agent-a82b274f08d4e1ae6 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 4.7K | 44.8K | 59.5K | 0.557 | claude-opus-5-5 |  |
| agent-a8ead6e12da3d1f52 | mayker-dev:builder | deliver | 5 | 12 | 17 | 1.55 | 2/1/8 | 2.00/3.00/1.25 | 5.8K | 55.0K | 60.6K | 0.928 | claude-sonnet-5-5 |  |
| agent-a93e8ebbb4269a475 | mayker-dev:planner | deliver | 5 | 15 | 35 | 2.5 | 0/2/11 | n/a/1.00/2.45 | 14.0K | 96.8K | 112.8K | 0.931 | claude-opus-5-5 |  |
| agent-a9971d43256123a1d | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 1/1/3 | 7.00/2.00/2.33 | 5.2K | 51.0K | 57.3K | 0.854 | claude-fable-5-1 |  |
| agent-aa0c7f3737f19c1ed | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 2/1/3 | 4.00/1.00/1.00 | 4.9K | 50.1K | 54.5K | 0.844 | claude-fable-5-1 |  |
| agent-aa4012cee62ae3f6f | mayker-dev:planner | deliver | 5 | 9 | 29 | 3.62 | 1/1/5 | 2.00/2.00/4.00 | 13.1K | 93.3K | 115.1K | 0.863 | claude-opus-5-5 |  |
| agent-aa8acf9a332ea093a | mayker-dev:builder | deliver | 5 | 13 | 16 | 1.33 | 3/2/7 | 1.67/1.50/1.14 | 7.4K | 57.6K | 64.4K | 0.932 | claude-sonnet-5-5 |  |
| agent-aaef1cd2bf132ca4e | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 5.1K | 51.6K | 66.1K | 0.679 | claude-opus-5-5 |  |
| agent-abf4f108d7909cd20 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 8.00/1.00/1.67 | 6.5K | 57.1K | 64.6K | 0.849 | claude-fable-5-1 |  |
| agent-ac07478839d7bfcf0 | mayker-dev:planner | deliver | 5 | 12 | 32 | 2.91 | 0/2/7 | n/a/1.50/2.29 | 14.8K | 104.1K | 123.7K | 0.911 | claude-opus-5-5 |  |
| agent-ac087ccaec1a2b40d | mayker-dev:orchestrator | deliver | 3 | 6 | 17 | 3.4 | 1/1/3 | 4.00/2.00/3.67 | 16.0K | 84.3K | 112.9K | 0.776 | claude-fable-5-1 |  |
| agent-ac9e59db57b6f0720 | mayker-dev:reviewer | deliver | 5 | 8 | 31 | 4.43 | 7/0/0 | 4.43/n/a/n/a | 9.3K | 63.3K | 74.9K | 0.87 | claude-opus-5-5 |  |
| agent-ad389e282845b3056 | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 3/2/2 | 3.00/2.00/1.00 | 3.9K | 54.2K | 59.5K | 0.893 | claude-sonnet-5-5 |  |
| agent-ad98b4f907da00bbd | mayker-dev:reviewer | deliver | 5 | 6 | 22 | 5.5 | 4/0/0 | 5.50/n/a/n/a | 9.5K | 57.2K | 70.6K | 0.794 | claude-opus-5-5 |  |
| agent-adc12fc005c42cb6c | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 4.00/1.00/1.33 | 5.2K | 47.6K | 52.5K | 0.88 | claude-fable-5-1 |  |
| agent-ae22f51c4aaf55b30 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 3/1/4 | 1.67/2.00/1.25 | 5.3K | 53.3K | 59.6K | 0.904 | claude-sonnet-5-5 |  |
| agent-ae378735bb66ce4af | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 4.00/2.00/2.00 | 4.0K | 51.5K | 58.6K | 0.81 | claude-fable-5-1 |  |
| agent-ae9fd09e141215576 | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 2/1/1 | 4.50/2.00/1.00 | 2.8K | 51.0K | 57.4K | 0.827 | claude-sonnet-5-5 |  |
| agent-aea032e32d6898a94 | mayker-dev:orchestrator | deliver | 5 | 7 | 10 | 2.0 | 1/1/3 | 4.00/1.00/1.67 | 5.6K | 49.7K | 55.5K | 0.877 | claude-fable-5-1 |  |
| agent-af0197e6e4c3c1186 | mayker-dev:builder | deliver | 5 | 12 | 27 | 2.45 | 2/1/7 | 2.50/4.00/2.43 | 6.7K | 69.8K | 78.9K | 0.922 | claude-sonnet-5-5 |  |
| agent-af439492d4b3c0a27 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/1/5 | 2.00/2.00/1.20 | 4.6K | 51.8K | 57.4K | 0.905 | claude-sonnet-5-5 |  |
| agent-af72c515d9d36234d | mayker-dev:builder | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 3.00/3.00/1.00 | 4.4K | 50.0K | 54.4K | 0.863 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 62.6K, peak 138.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.3K, 43.1K, 43.7K, 47.7K, 49.3K, 50.5K, 52.5K, 52.8K, 54.4K, 54.5K, 55.5K, 57.3K, 57.4K, 57.4K, 57.6K, 58.6K, 59.5K, 59.5K, 59.6K, 59.9K, 60.6K, 60.6K, 60.9K, 64.4K, 64.5K, 64.6K, 65.3K, 66.0K, 66.1K, 70.1K, 70.6K, 71.6K, 74.9K, 75.4K, 76.4K, 78.6K, 78.6K, 78.9K, 79.4K, 100.2K, 112.8K, 112.9K, 115.1K, 123.3K, 123.7K, 138.9K.

**All runs:** 1 run(s), wall 51m06s (sum of per-run walls, idle time between runs excluded), 563 turns, 1029 tool calls, 438.3K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 85/63/302 turns, 3.59/2.14/1.71 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 45m03s of round trip (command plus model time, ADR 0006 section 2): 88% of wall.

All runs: CI wait: 7m59s in `ci-poll.sh` calls; framework wall (wall less CI wait) 43m06s.

12 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/9).
