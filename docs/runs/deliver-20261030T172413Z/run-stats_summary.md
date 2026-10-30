# Run statistics, run

Generated 2026-10-30 18:45 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 4m17s | 9 | 30 | 3.75 | 9 | 21.7K | 94.3K | 135.0K | 0 | 0.836 | claude-fable-5-1 | 1/2/4 | 4.00/2.50/5.00 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 4m17s | 9 | 30 | 3.75 | 9 | 21.7K | 94.3K | 135.0K | 0 | 0.836 | claude-fable-5-1 | 1/2/4 | 4.00/2.50/5.00 |  |
| 5 | Scheduler loop | 1h10m | 581 | 1110 | 2.17 | 15 | 440.5K | 142.3K | 457.4K | 0 | 0.961 | claude-opus-5-5 | 79/68/324 | 4.39/2.24/1.64 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at final boundary | 2m45s | 11 | 24 | 2.4 | 5 | 13.4K | 147.3K | 455.3K | 0 | 0.936 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/2.50 |  |
| 8 | Final report | 4m53s | 11 | 15 | 1.67 | 3 | 29.1K | 179.3K | 472.1K | 0 | 0.957 | claude-fable-5-1 | 3/1/4 | 2.00/1.00/1.75 |  |
| **run total** |  | 1h20m | 601 | 1155 | 2.19 | 15 | 491.3K |  | 472.1K |  | 0.96 | claude-opus-5-5 | 83/71/332 (exec 84% of wall) | 4.30/2.23/1.68 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h20m.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 1h07m of round trip (command plus model time, ADR 0006 section 2): 84% of wall.

CI wait: 25m49s in `ci-poll.sh` calls; framework wall (wall less CI wait) 54m45s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a022ad4a0e42f059d | mayker-dev:planner | deliver | 5 | 13 | 38 | 3.17 | 2/3/6 | 4.00/1.33/2.50 | 20.4K | 108.8K | 131.6K | 0.917 | claude-opus-5-5 |  |
| agent-a053c557cec1a57c4 | mayker-dev:reviewer | deliver | 5 | 4 | 16 | 5.33 | 3/0/0 | 5.33/n/a/n/a | 5.7K | 51.8K | 66.2K | 0.681 | claude-opus-5-5 |  |
| agent-a0a388d0d05ccd270 | mayker-dev:builder | deliver | 5 | 11 | 18 | 1.8 | 2/2/6 | 3.00/1.50/1.50 | 6.8K | 70.1K | 78.9K | 0.916 | claude-sonnet-5-5 |  |
| agent-a0ba7553a49ee8c77 | mayker-dev:builder | deliver | 5 | 12 | 25 | 2.27 | 1/1/8 | 4.00/5.00/1.88 | 5.5K | 67.7K | 75.4K | 0.924 | claude-sonnet-5-5 |  |
| agent-a0e40e5e532f45555 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 0/0/2 | n/a/n/a/2.00 | 877 | 40.7K | 47.8K | 0.723 | claude-sonnet-5-5 |  |
| agent-a11822260f7fa483d | mayker-dev:builder | deliver | 5 | 9 | 17 | 2.12 | 2/2/4 | 2.50/2.50/1.75 | 9.0K | 68.6K | 79.1K | 0.894 | claude-sonnet-5-5 |  |
| agent-a19017c2c73c8f637 | mayker-dev:builder | deliver | 5 | 13 | 31 | 2.58 | 2/2/8 | 7.00/2.00/1.62 | 7.2K | 72.4K | 80.8K | 0.929 | claude-sonnet-5-5 |  |
| agent-a292d5c982daf74e3 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 1/1/2 | 2.00/1.00/2.00 | 2.4K | 44.0K | 47.3K | 0.848 | claude-sonnet-5-5 |  |
| agent-a2aec541968fb496c | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 7.00/1.00/1.00 | 4.6K | 48.2K | 52.4K | 0.838 | claude-fable-5-1 |  |
| agent-a30ef627502db5d36 | mayker-dev:orchestrator | deliver | 5 | 9 | 17 | 2.12 | 2/1/5 | 3.00/1.00/2.00 | 7.6K | 54.4K | 65.5K | 0.866 | claude-fable-5-1 |  |
| agent-a374adcf0b2eb5965 | mayker-dev:orchestrator | deliver | 3 | 7 | 27 | 4.5 | 1/1/4 | 4.00/3.00/5.00 | 19.7K | 98.7K | 135.0K | 0.804 | claude-fable-5-1 |  |
| agent-a5034afd96e9e1652 | mayker-dev:builder | deliver | 5 | 8 | 25 | 3.57 | 2/1/4 | 3.00/8.00/2.75 | 7.0K | 68.5K | 78.4K | 0.857 | claude-sonnet-5-5 |  |
| agent-a5124f6af176161e0 | mayker-dev:orchestrator | deliver | 5 | 7 | 23 | 3.83 | 2/1/2 | 4.00/1.00/4.50 | 7.6K | 61.3K | 73.7K | 0.859 | claude-fable-5-1 |  |
| agent-a52373355c3eddc4c | mayker-dev:orchestrator | deliver | 5 | 8 | 11 | 1.57 | 1/1/5 | 3.00/1.00/1.40 | 4.2K | 48.8K | 56.1K | 0.89 | claude-fable-5-1 |  |
| agent-a5257132ad9efda7d | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 6.0K | 52.9K | 68.2K | 0.678 | claude-opus-5-5 |  |
| agent-a52a6fb41562c1633 | mayker-dev:reviewer | deliver | 5 | 5 | 27 | 6.75 | 4/0/0 | 6.75/n/a/n/a | 8.4K | 61.3K | 79.0K | 0.774 | claude-opus-5-5 |  |
| agent-a5327effc69f3b89f | mayker-dev:builder | deliver | 5 | 9 | 19 | 2.38 | 1/2/5 | 6.00/4.00/1.00 | 6.0K | 69.5K | 78.2K | 0.875 | claude-sonnet-5-5 |  |
| agent-a578da539ef4ba670 | mayker-dev:builder | deliver | 5 | 15 | 25 | 1.79 | 4/1/9 | 2.25/2.00/1.56 | 7.9K | 75.7K | 85.1K | 0.937 | claude-sonnet-5-5 |  |
| agent-a59135a90e939360c | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 4.50/1.00/1.00 | 2.7K | 51.8K | 56.6K | 0.862 | claude-sonnet-5-5 |  |
| agent-a5c8fcd3c9882c850 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 1/2/5 | 3.00/1.50/1.60 | 6.9K | 59.5K | 66.5K | 0.902 | claude-sonnet-5-5 |  |
| agent-a64f7f790ae6dd653 | mayker-dev:planner | deliver | 5 | 12 | 32 | 2.91 | 1/1/8 | 5.00/2.00/2.88 | 12.6K | 103.0K | 125.3K | 0.91 | claude-opus-5-5 |  |
| agent-a7f63079c206b2e93 | mayker-dev:orchestrator | deliver | 8 | 8 | 12 | 2.0 | 3/0/3 | 2.00/n/a/2.00 | 19.7K | 71.0K | 84.8K | 0.877 | claude-fable-5-1 |  |
| agent-a8bdbe10a998a396f | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 6.6K | 52.9K | 67.8K | 0.726 | claude-opus-5-5 |  |
| agent-a8e3b218d637f50f6 | mayker-dev:planner | deliver | 5 | 12 | 35 | 3.18 | 1/1/8 | 5.00/2.00/2.38 | 15.7K | 100.5K | 124.2K | 0.897 | claude-opus-5-5 |  |
| agent-a99f69699fab6bf6a | mayker-dev:builder | deliver | 5 | 17 | 30 | 1.88 | 4/1/10 | 2.25/3.00/1.70 | 6.6K | 72.3K | 79.6K | 0.947 | claude-sonnet-5-5 |  |
| agent-a9e8af202cdc91eb0 | mayker-dev:builder | deliver | 5 | 7 | 24 | 4.0 | 2/2/2 | 5.50/5.00/1.50 | 7.7K | 69.4K | 80.4K | 0.863 | claude-sonnet-5-5 |  |
| agent-aa30b4e0131aa6163 | mayker-dev:reviewer | deliver | 5 | 5 | 21 | 5.25 | 4/0/0 | 5.25/n/a/n/a | 5.3K | 52.7K | 63.7K | 0.758 | claude-opus-5-5 |  |
| agent-aa574dd3b08232cfd | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 0/0/3 | n/a/n/a/2.00 | 1.3K | 47.8K | 52.8K | 0.797 | claude-sonnet-5-5 |  |
| agent-aa7cb5f318a5c3c65 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 3.00/3.00/1.33 | 6.6K | 53.7K | 61.1K | 0.874 | claude-sonnet-5-5 |  |
| agent-aa87a662087e62bbd | mayker-dev:builder | deliver | 5 | 18 | 39 | 2.29 | 2/2/12 | 3.50/3.50/2.00 | 8.3K | 64.2K | 73.3K | 0.949 | claude-sonnet-5-5 |  |
| agent-aba52a40f4820185c | mayker-dev:planner | deliver | 5 | 11 | 29 | 2.9 | 1/2/6 | 6.00/1.50/2.17 | 14.7K | 103.4K | 129.1K | 0.886 | claude-opus-5-5 |  |
| agent-aba5d71b23fde8358 | mayker-dev:planner | deliver | 5 | 11 | 26 | 2.6 | 1/1/8 | 4.00/2.00/2.50 | 17.2K | 97.3K | 121.1K | 0.9 | claude-opus-5-5 |  |
| agent-abb19023a0604ed5a | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 1/1/5 | 7.00/2.00/1.80 | 6.5K | 55.8K | 63.5K | 0.857 | claude-fable-5-1 |  |
| agent-abf6a3e4a5a600447 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 7.00/1.00/2.00 | 5.9K | 51.3K | 57.1K | 0.857 | claude-fable-5-1 |  |
| agent-acb8efc2ade0de466 | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 0/1/5 | n/a/1.00/1.80 | 3.0K | 47.6K | 52.9K | 0.883 | claude-sonnet-5-5 |  |
| agent-acc05dd7f58d86f47 | mayker-dev:orchestrator | deliver | 5 | 9 | 21 | 2.62 | 1/1/6 | 4.00/2.00/2.50 | 11.3K | 79.1K | 98.9K | 0.861 | claude-fable-5-1 |  |
| agent-ad10256de68c46bf8 | mayker-dev:orchestrator | deliver | 5 | 10 | 17 | 2.12 | 1/2/5 | 4.00/1.00/2.20 | 9.1K | 57.9K | 68.0K | 0.882 | claude-fable-5-1 |  |
| agent-ae0ee29ecbb69c70e | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 6.4K | 56.5K | 62.4K | 0.855 | claude-fable-5-1 |  |
| agent-ae1012c5314a06879 | mayker-dev:builder | deliver | 5 | 11 | 19 | 1.9 | 3/2/5 | 2.33/1.00/2.00 | 5.2K | 67.5K | 74.8K | 0.918 | claude-sonnet-5-5 |  |
| agent-ae22867394ade2c22 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 1/4/3 | 5.00/1.50/1.00 | 4.4K | 56.5K | 61.9K | 0.906 | claude-sonnet-5-5 |  |
| agent-aed8318dffad732d9 | mayker-dev:orchestrator | deliver | 5 | 11 | 15 | 1.67 | 2/2/5 | 2.50/1.00/1.60 | 10.6K | 54.7K | 64.5K | 0.915 | claude-fable-5-1 |  |
| agent-af3de09ceed23b929 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/2/2 | 5.00/5.00/1.50 | 8.1K | 72.6K | 83.1K | 0.864 | claude-sonnet-5-5 |  |
| agent-af59f98d274639b74 | mayker-dev:builder | deliver | 5 | 9 | 21 | 2.62 | 2/2/4 | 6.50/1.50/1.25 | 4.9K | 69.0K | 75.9K | 0.9 | claude-sonnet-5-5 |  |
| agent-af8b065cb2eded4a1 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 1/1/6 | 4.00/2.00/1.33 | 5.4K | 57.4K | 63.4K | 0.904 | claude-sonnet-5-5 |  |
| agent-af96993e730c50d7b | mayker-dev:orchestrator | deliver | 5 | 8 | 12 | 1.71 | 1/1/5 | 3.00/1.00/1.60 | 7.2K | 48.8K | 56.1K | 0.856 | claude-fable-5-1 |  |
| agent-afd8a94d8be358866 | mayker-dev:builder | deliver | 5 | 7 | 29 | 4.83 | 2/1/3 | 6.00/13.00/1.33 | 7.9K | 68.2K | 78.0K | 0.866 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 73.5K, peak 135.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 47.3K, 47.8K, 52.4K, 52.8K, 52.9K, 56.1K, 56.1K, 56.6K, 57.1K, 61.1K, 61.9K, 62.4K, 63.4K, 63.5K, 63.7K, 64.5K, 65.5K, 66.2K, 66.5K, 67.8K, 68.0K, 68.2K, 73.3K, 73.7K, 74.8K, 75.4K, 75.9K, 78.0K, 78.2K, 78.4K, 78.9K, 79.0K, 79.1K, 79.6K, 80.4K, 80.8K, 83.1K, 84.8K, 85.1K, 98.9K, 121.1K, 124.2K, 125.3K, 129.1K, 131.6K, 135.0K.

**All runs:** 1 run(s), wall 1h20m (sum of per-run walls, idle time between runs excluded), 607 turns, 1163 tool calls, 494.0K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 84/71/336 turns, 4.26/2.23/1.68 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 1h08m of round trip (command plus model time, ADR 0006 section 2): 85% of wall.

All runs: CI wait: 25m49s in `ci-poll.sh` calls; framework wall (wall less CI wait) 54m45s.

6 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 1/0/4).

14 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 3/0/10).
