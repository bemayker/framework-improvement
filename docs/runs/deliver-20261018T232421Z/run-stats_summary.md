# Run statistics, run

Generated 2026-10-19 00:33 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 45 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 3m40s | 9 | 20 | 2.5 | 5 | 5.1K | 90.4K | 114.6K | 0 | 0.869 | claude-fable-5-1 | 1/0/6 | 5.00/n/a/2.33 |  |
| 3.orchestrator (in 3) | Orchestrator ingest and graph | 3m40s | 9 | 20 | 2.5 | 5 | 5.1K | 90.4K | 114.6K | 0 | 0.869 | claude-fable-5-1 | 1/0/6 | 5.00/n/a/2.33 |  |
| 5 | Scheduler loop | 59m59s | 513 | 1003 | 2.25 | 15 | 181.2K | 176.5K | 492.3K | 0 | 0.964 | claude-opus-5-5 | 61/21/316 | 4.70/3.24/1.69 |  |
| 8 | Final report | 4m37s | 12 | 16 | 1.45 | 6 | 8.9K | 178.1K | 505.6K | 0 | 0.955 | claude-fable-5-1 | 2/0/8 | 3.50/n/a/1.00 |  |
| **run total** |  | 1h08m | 534 | 1039 | 2.24 | 15 | 195.1K |  | 505.6K |  | 0.963 | claude-opus-5-5 | 64/21/330 (exec 91% of wall) | 4.67/3.24/1.69 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h08m.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 1h02m of round trip (command plus model time, ADR 0006 section 2): 91% of wall.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a04eb9130dd893970 | mayker-dev:orchestrator | deliver | 5 | 4 | 21 | 7.0 | 0/0/2 | n/a/n/a/5.00 | 17 | 79.1K | 101.0K | 0.717 | claude-fable-5-1 |  |
| agent-a0b5398a2b9b3aea6 | mayker-dev:planner | deliver | 5 | 20 | 40 | 2.11 | 1/0/17 | 1.00/n/a/1.47 | 689 | 106.8K | 125.4K | 0.941 | claude-opus-5-5 |  |
| agent-a0b6caf2bf61d4175 | mayker-dev:orchestrator | deliver | 5 | 2 | 4 | 4.0 | 0/0/1 | n/a/n/a/4.00 | 4 | 37.8K | 42.5K | 0.59 | claude-fable-5-1 |  |
| agent-a0b76c377c0e0e1c9 | mayker-dev:orchestrator | deliver | 3 | 7 | 17 | 2.83 | 1/0/5 | 5.00/n/a/2.40 | 2.5K | 84.1K | 101.2K | 0.828 | claude-fable-5-1 |  |
| agent-a136ff8a588864f7b | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 4.00/2.00/1.67 | 1.2K | 69.7K | 79.0K | 0.865 | claude-sonnet-5-5 |  |
| agent-a15a41a995b2570cd | mayker-dev:builder | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 3.00/1.00/1.67 | 824 | 54.0K | 59.6K | 0.856 | claude-sonnet-5-5 |  |
| agent-a1c99b00788cf71bb | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 5.00/3.00/1.50 | 1.1K | 60.7K | 71.5K | 0.839 | claude-sonnet-5-5 |  |
| agent-a2b9573b41ba808fc | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 4.00/4.00/1.00 | 565 | 62.5K | 70.2K | 0.813 | claude-sonnet-5-5 |  |
| agent-a2c6713d10245bc6b | mayker-dev:orchestrator | deliver | 5 | 2 | 5 | 5.0 | 0/0/1 | n/a/n/a/5.00 | 7 | 37.8K | 42.7K | 0.436 | claude-fable-5-1 |  |
| agent-a2ee3a9fad39d5dd2 | mayker-dev:orchestrator | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 4 | 37.1K | 41.1K | 0.446 | claude-fable-5-1 |  |
| agent-a3e07fbda38ea9878 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/0/3 | 4.00/n/a/1.33 | 839 | 47.3K | 52.0K | 0.862 | claude-sonnet-5-5 |  |
| agent-a59dd8018cafab406 | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 4.00/2.00/1.67 | 980 | 67.2K | 75.8K | 0.866 | claude-sonnet-5-5 |  |
| agent-a5e704559c56e6e48 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 1/0/3 | 2.00/n/a/1.67 | 624 | 51.9K | 57.3K | 0.829 | claude-sonnet-5-5 |  |
| agent-a617dd92d49eb56a5 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 1/0/2 | 3.00/n/a/1.00 | 601 | 42.9K | 50.8K | 0.78 | claude-sonnet-5-5 |  |
| agent-a61df8ed72cb6fd0f | mayker-dev:builder | deliver | 5 | 13 | 28 | 2.33 | 1/1/9 | 5.00/3.00/2.11 | 1.4K | 68.2K | 74.8K | 0.93 | claude-sonnet-5-5 |  |
| agent-a666c244e4a864ba6 | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 3.50/2.00/2.00 | 1.1K | 69.3K | 79.3K | 0.863 | claude-sonnet-5-5 |  |
| agent-a70dce9c48ffeba5c | mayker-dev:orchestrator | deliver | 5 | 4 | 19 | 6.33 | 1/0/1 | 10.00/n/a/5.00 | 44 | 73.4K | 91.9K | 0.726 | claude-fable-5-1 |  |
| agent-a7706efa9c0f150e1 | mayker-dev:planner | deliver | 5 | 16 | 28 | 1.87 | 1/0/13 | 5.00/n/a/1.15 | 2.6K | 93.4K | 112.0K | 0.925 | claude-opus-5-5 |  |
| agent-a798752bfc4a8d09d | mayker-dev:builder | deliver | 5 | 18 | 33 | 1.94 | 2/1/13 | 3.00/2.00/1.85 | 2.3K | 81.7K | 89.8K | 0.948 | claude-sonnet-5-5 |  |
| agent-a79bd6b49f172cb9c | mayker-dev:reviewer | deliver | 5 | 4 | 23 | 7.67 | 3/0/0 | 7.67/n/a/n/a | 42 | 58.5K | 76.6K | 0.673 | claude-opus-5-5 |  |
| agent-a8199f7ed1d06f30b | mayker-dev:planner | deliver | 5 | 15 | 28 | 2.0 | 2/0/12 | 4.00/n/a/1.67 | 2.7K | 90.1K | 107.5K | 0.929 | claude-opus-5-5 |  |
| agent-a8931340ad0b319eb | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 40 | 47.2K | 64.2K | 0.611 | claude-opus-5-5 |  |
| agent-a8c82db30e8aad57f | mayker-dev:builder | deliver | 5 | 7 | 33 | 5.5 | 2/2/2 | 7.50/7.50/1.50 | 1.1K | 72.4K | 83.9K | 0.86 | claude-sonnet-5-5 |  |
| agent-a8cb8b07248b397c9 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 12 | 45.8K | 61.8K | 0.55 | claude-opus-5-5 |  |
| agent-a8f42f36bbd10211a | mayker-dev:orchestrator | deliver | 5 | 4 | 8 | 2.67 | 1/0/2 | 3.00/n/a/2.50 | 42 | 42.4K | 49.2K | 0.777 | claude-fable-5-1 |  |
| agent-a96fb426850213e97 | mayker-dev:orchestrator | deliver | 5 | 2 | 6 | 6.0 | 0/0/1 | n/a/n/a/6.00 | 5 | 41.4K | 49.8K | 0.4 | claude-fable-5-1 |  |
| agent-a97cbce8665302b04 | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 3/0/3 | 4.33/n/a/1.33 | 1.2K | 53.3K | 61.6K | 0.87 | claude-sonnet-5-5 |  |
| agent-a9c3e7c36a6a3939a | mayker-dev:orchestrator | deliver | 5 | 5 | 22 | 5.5 | 0/0/3 | n/a/n/a/3.67 | 152 | 78.7K | 93.8K | 0.761 | claude-fable-5-1 |  |
| agent-aa24b5af59fc79073 | mayker-dev:planner | deliver | 5 | 17 | 33 | 2.06 | 1/0/14 | 5.00/n/a/1.71 | 690 | 93.0K | 114.0K | 0.928 | claude-opus-5-5 |  |
| agent-aa54fa88590ae2e83 | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 38 | 47.4K | 65.1K | 0.541 | claude-opus-5-5 |  |
| agent-aa9348c5f02aaa354 | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 5.00/2.00/1.00 | 816 | 58.3K | 65.4K | 0.82 | claude-sonnet-5-5 |  |
| agent-ab526753fed8c75a2 | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.5 | 2/0/2 | 4.00/n/a/1.00 | 904 | 49.6K | 54.8K | 0.831 | claude-sonnet-5-5 |  |
| agent-abbb95ecb80b7f38d | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/1/3 | 3.50/2.00/2.33 | 1.1K | 69.1K | 78.7K | 0.864 | claude-sonnet-5-5 |  |
| agent-ac54a199e003f6416 | mayker-dev:orchestrator | deliver | 5 | 4 | 19 | 6.33 | 0/0/3 | n/a/n/a/6.33 | 1.3K | 52.8K | 69.4K | 0.671 | claude-fable-5-1 |  |
| agent-ad111bca730de8231 | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/1/4 | 3.50/2.00/1.75 | 1.1K | 80.6K | 92.8K | 0.876 | claude-sonnet-5-5 |  |
| agent-ad4ff92ddd252a0d5 | mayker-dev:builder | deliver | 5 | 9 | 18 | 2.25 | 1/3/4 | 7.00/2.33/1.00 | 1.4K | 66.1K | 72.6K | 0.9 | claude-sonnet-5-5 |  |
| agent-ad55c0d24c1f64039 | mayker-dev:builder | deliver | 5 | 8 | 21 | 3.0 | 2/2/3 | 5.00/4.00/1.00 | 1.6K | 64.0K | 72.9K | 0.858 | claude-sonnet-5-5 |  |
| agent-ad65e9f2c30aae408 | mayker-dev:builder | deliver | 5 | 5 | 15 | 3.75 | 2/0/2 | 6.50/n/a/1.00 | 1.6K | 60.5K | 69.8K | 0.812 | claude-sonnet-5-5 |  |
| agent-ad722744b3cc17810 | mayker-dev:builder | deliver | 5 | 2 | 4 | 4.0 | 0/0/1 | n/a/n/a/4.00 | 528 | 46.7K | 58.9K | 0.508 | claude-sonnet-5-5 |  |
| agent-ae4f6a8bf6bc7ffa0 | mayker-dev:builder | deliver | 5 | 10 | 27 | 3.0 | 2/2/5 | 3.00/5.50/2.00 | 1.6K | 70.8K | 78.4K | 0.889 | claude-sonnet-5-5 |  |
| agent-ae56111a712d83a19 | mayker-dev:orchestrator | deliver | 8 | 9 | 13 | 1.62 | 2/0/6 | 3.50/n/a/1.00 | 2.7K | 70.6K | 81.8K | 0.871 | claude-fable-5-1 |  |
| agent-ae963192952a48af8 | mayker-dev:reviewer | deliver | 5 | 3 | 21 | 10.5 | 2/0/0 | 10.50/n/a/n/a | 37 | 52.0K | 73.1K | 0.589 | claude-opus-5-5 |  |
| agent-aed5d30f383f6a8dd | mayker-dev:planner | deliver | 5 | 14 | 26 | 2.0 | 0/0/12 | n/a/n/a/1.50 | 2.5K | 88.0K | 105.9K | 0.924 | claude-opus-5-5 |  |
| agent-af38a899f79568860 | mayker-dev:builder | deliver | 5 | 21 | 36 | 1.8 | 1/1/18 | 1.00/2.00/1.83 | 1.9K | 71.3K | 80.7K | 0.955 | claude-sonnet-5-5 |  |
| agent-afc7a42a0ab5a8ff0 | mayker-dev:orchestrator | deliver | 5 | 3 | 23 | 11.5 | 0/0/2 | n/a/n/a/11.50 | 13 | 58.8K | 94.1K | 0.532 | claude-fable-5-1 |  |

**45 dispatch(es)** (mayker-dev:builder 23, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 73.1K, peak 125.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 41.1K, 42.5K, 42.7K, 49.2K, 49.8K, 50.8K, 52.0K, 54.8K, 57.3K, 58.9K, 59.6K, 61.6K, 61.8K, 64.2K, 65.1K, 65.4K, 69.4K, 69.8K, 70.2K, 71.5K, 72.6K, 72.9K, 73.1K, 74.8K, 75.8K, 76.6K, 78.4K, 78.7K, 79.0K, 79.3K, 80.7K, 81.8K, 83.9K, 89.8K, 91.9K, 92.8K, 93.8K, 94.1K, 101.0K, 101.2K, 105.9K, 107.5K, 112.0K, 114.0K, 125.4K.

**All runs:** 1 run(s), wall 1h08m (sum of per-run walls, idle time between runs excluded), 534 turns, 1039 tool calls, 195.1K output tokens, cache hit 0.963.

Turn classes across every bucket, read / edit / exec: 64/21/330 turns, 4.67/3.24/1.69 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 1h02m of round trip (command plus model time, ADR 0006 section 2): 91% of wall.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 3/0/7).
