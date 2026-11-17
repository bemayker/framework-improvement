# Run statistics, run

Generated 2026-11-17 20:26 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 43m30s | 549 | 1056 | 2.23 | 15 | 407.6K |  | 559.8K |  | 0.966 | claude-opus-5-5 | 89/70/265 (exec 70% of wall) | 3.93/2.17/1.77 |  |

Wall is this run's last step end minus its first step start; steps sum to 43m30s.

Exec turns took 30m35s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

CI wait: 4m06s in `ci-poll.sh` calls; framework wall (wall less CI wait) 39m23s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a01e080b4f1f1928b | mayker-dev:orchestrator | deliver | 5,8 | 12 | 25 | 2.27 | 1/3/7 | 4.00/1.33/2.43 | 7.4K | 88.5K | 104.4K | 0.914 | claude-fable-5-2 |  |
| agent-a096f8961e977d77c | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 1/3/2 | 6.00/1.33/1.00 | 3.9K | 56.5K | 62.0K | 0.876 | claude-sonnet-5-5 |  |
| agent-a1867d7228ebb1e7d | mayker-dev:builder | deliver | 5 | 9 | 25 | 3.12 | 2/2/4 | 4.00/5.00/1.75 | 7.4K | 62.9K | 72.3K | 0.895 | claude-sonnet-5-5 |  |
| agent-a18a56fc9d70c68c8 | mayker-dev:builder | deliver | 5 | 13 | 28 | 2.33 | 1/1/10 | 3.00/2.00/2.30 | 6.4K | 74.4K | 87.1K | 0.923 | claude-sonnet-5-5 |  |
| agent-a19a4722fc5f013d1 | mayker-dev:reviewer | deliver | 5 | 4 | 27 | 9.0 | 3/0/0 | 9.00/n/a/n/a | 8.9K | 53.5K | 71.5K | 0.709 | claude-opus-5-5 |  |
| agent-a2bef3fdfa62ca4c6 | mayker-dev:builder | deliver | 5 | 4 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 1.1K | 42.5K | 50.5K | 0.78 | claude-sonnet-5-5 |  |
| agent-a3048ede933f9b695 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 1/1/4 | 1.00/2.00/3.75 | 5.1K | 53.1K | 59.6K | 0.874 | claude-fable-5-2 |  |
| agent-a3311ef6209005ff7 | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 3.00/7.00/1.67 | 6.9K | 55.4K | 64.4K | 0.846 | claude-sonnet-5-5 |  |
| agent-a3391e66d622bdd01 | mayker-dev:builder | deliver | 5 | 7 | 31 | 5.17 | 2/1/3 | 7.00/14.00/1.00 | 8.9K | 63.9K | 75.2K | 0.832 | claude-sonnet-5-5 |  |
| agent-a42df7cbabb3aa72e | mayker-dev:orchestrator | deliver | 5 | 5 | 7 | 1.75 | 2/1/1 | 2.00/2.00/1.00 | 2.3K | 39.8K | 43.7K | 0.78 | claude-fable-5-2 |  |
| agent-a47009146f59db6ce | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 1/2/3 | 8.00/2.00/2.00 | 4.9K | 49.7K | 54.5K | 0.88 | claude-fable-5-2 |  |
| agent-a4b4397909116d0b7 | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 1/1/4 | 8.00/2.00/2.00 | 5.5K | 56.1K | 63.8K | 0.87 | claude-fable-5-2 |  |
| agent-a4e28aeff3d3b1b8a | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 1/3/3 | 5.00/1.00/1.00 | 3.1K | 51.7K | 56.1K | 0.896 | claude-sonnet-5-5 |  |
| agent-a4e4795644ca3e7e3 | mayker-dev:builder | deliver | 5 | 4 | 5 | 2.5 | 1/0/1 | 1.00/n/a/4.00 | 1.3K | 44.7K | 55.0K | 0.766 | claude-sonnet-5-5 |  |
| agent-a56b407f13dcafb69 | mayker-dev:orchestrator | deliver | 5 | 5 | 12 | 3.0 | 0/1/3 | n/a/2.00/3.33 | 4.0K | 46.3K | 51.0K | 0.779 | claude-fable-5-2 |  |
| agent-a5744e9f36a4487ae | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 8.00/2.00/1.50 | 4.8K | 51.5K | 57.4K | 0.876 | claude-fable-5-2 |  |
| agent-a5b89ce3d7355d03e | mayker-dev:planner | deliver | 5 | 11 | 27 | 2.7 | 1/2/7 | 7.00/1.50/2.43 | 13.5K | 82.6K | 98.7K | 0.891 | claude-opus-5-5 |  |
| agent-a5df11d6b235a3c1f | mayker-dev:orchestrator | deliver | 5 | 5 | 7 | 1.75 | 2/1/1 | 2.00/2.00/1.00 | 2.1K | 39.8K | 43.7K | 0.845 | claude-fable-5-2 |  |
| agent-a6171ac9c9c832fe5 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 1/2/5 | 3.00/1.50/1.40 | 5.8K | 52.9K | 59.0K | 0.904 | claude-sonnet-5-5 |  |
| agent-a63194a7312d965b4 | mayker-dev:planner | deliver | 5 | 11 | 27 | 2.7 | 2/1/7 | 3.50/2.00/2.57 | 15.2K | 74.3K | 93.0K | 0.902 | claude-opus-5-5 |  |
| agent-a6b6eacff84a7c65b | mayker-dev:orchestrator | deliver | 5 | 4 | 7 | 2.33 | 1/1/1 | 4.00/2.00/1.00 | 2.0K | 40.2K | 43.4K | 0.809 | claude-fable-5-2 |  |
| agent-a6c526c176e6ef2be | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.50/1.00/1.00 | 2.8K | 56.0K | 62.8K | 0.852 | claude-sonnet-5-5 |  |
| agent-a714e4f353c799aa3 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 1/2/1 | 6.00/3.50/1.00 | 4.0K | 56.1K | 64.0K | 0.772 | claude-sonnet-5-5 |  |
| agent-a79a3072cbd2f486d | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 2/1/1 | 4.50/2.00/1.00 | 2.8K | 56.9K | 66.3K | 0.813 | claude-sonnet-5-5 |  |
| agent-a7ac025a4eb5247de | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 1/2/5 | 3.00/1.50/1.60 | 7.0K | 56.1K | 64.1K | 0.899 | claude-sonnet-5-5 |  |
| agent-a8a56a847eee23953 | mayker-dev:orchestrator | deliver | 5 | 4 | 8 | 2.67 | 1/1/1 | 5.00/2.00/1.00 | 2.9K | 42.2K | 46.1K | 0.727 | claude-fable-5-2 |  |
| agent-a8aa0f68a0e6e5990 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.00/5.00/1.00 | 5.7K | 54.2K | 62.0K | 0.871 | claude-sonnet-5-5 |  |
| agent-a8db1b4ee0076485d | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 5.6K | 44.0K | 60.5K | 0.542 | claude-opus-5-5 |  |
| agent-a95dd57cd306e1935 | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 3.00/2.00/1.50 | 2.5K | 40.1K | 44.2K | 0.843 | claude-fable-5-2 |  |
| agent-a9938666d3e6e5c41 | mayker-dev:builder | deliver | 5 | 15 | 28 | 2.0 | 3/1/10 | 2.67/3.00/1.70 | 7.2K | 65.0K | 73.4K | 0.938 | claude-sonnet-5-5 |  |
| agent-a9d0f71ee74636c38 | mayker-dev:builder | deliver | 5 | 3 | 6 | 3.0 | 2/0/0 | 3.00/n/a/n/a | 1.0K | 44.8K | 55.4K | 0.685 | claude-sonnet-5-5 |  |
| agent-aae276eb1e52ecc94 | mayker-dev:builder | deliver | 5 | 6 | 9 | 1.8 | 3/1/1 | 2.33/1.00/1.00 | 1.7K | 50.7K | 57.0K | 0.856 | claude-sonnet-5-5 |  |
| agent-ab490d6332e60b553 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.1K | 46.4K | 61.6K | 0.652 | claude-sonnet-5-5 |  |
| agent-ab57c4a153e587d1e | mayker-dev:builder | deliver | 5 | 9 | 20 | 2.5 | 1/2/5 | 4.00/1.00/2.80 | 4.5K | 61.4K | 68.5K | 0.9 | claude-sonnet-5-5 |  |
| agent-abc083b6d72099f92 | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 4.8K | 42.8K | 57.3K | 0.554 | claude-opus-5-5 |  |
| agent-abf14d64a734e9e93 | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 4.50/10.00/1.00 | 6.6K | 62.2K | 73.4K | 0.838 | claude-sonnet-5-5 |  |
| agent-abf773874f4f2803b | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 1/1/3 | 4.00/3.00/1.00 | 4.7K | 49.8K | 54.5K | 0.861 | claude-sonnet-5-5 |  |
| agent-abfa78dd7cce95a9d | mayker-dev:orchestrator | deliver | 8 | 3 | 6 | 3.0 | 2/0/0 | 3.00/n/a/n/a | 7.9K | 50.3K | 57.3K | 0.62 | claude-fable-5-2 |  |
| agent-acf5becbffb112893 | mayker-dev:planner | deliver | 5 | 12 | 37 | 3.36 | 4/1/6 | 4.75/2.00/2.67 | 15.5K | 82.1K | 106.9K | 0.892 | claude-opus-5-5 |  |
| agent-ad959a66784e491d4 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 7.1K | 46.4K | 65.6K | 0.596 | claude-opus-5-5 |  |
| agent-ae1c76ad512276a21 | mayker-dev:orchestrator | deliver | 5 | 10 | 32 | 3.56 | 1/3/5 | 4.00/2.33/4.20 | 10.7K | 94.6K | 117.1K | 0.89 | claude-fable-5-2 |  |
| agent-ae42c33af192adcd1 | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.6 | 3/2/5 | 2.00/1.50/1.40 | 7.1K | 54.7K | 62.1K | 0.919 | claude-sonnet-5-5 |  |
| agent-ae993642bbf1dd17e | mayker-dev:planner | deliver | 5 | 14 | 36 | 2.77 | 1/1/10 | 6.00/2.00/2.70 | 13.4K | 79.3K | 95.5K | 0.926 | claude-opus-5-5 |  |
| agent-af50e5240b985f352 | mayker-dev:reviewer | deliver | 5 | 3 | 14 | 7.0 | 2/0/0 | 7.00/n/a/n/a | 6.2K | 43.6K | 59.5K | 0.617 | claude-opus-5-5 |  |
| agent-af781092c2836d182 | mayker-dev:planner | deliver | 5 | 10 | 32 | 3.56 | 1/1/5 | 5.00/2.00/2.20 | 19.1K | 82.2K | 109.4K | 0.883 | claude-opus-5-5 |  |
| agent-af7a52aa935b8af83 | mayker-dev:orchestrator | deliver | 3 | 13 | 28 | 2.33 | 1/3/6 | 4.00/1.33/2.33 | 10.5K | 80.4K | 95.6K | 0.909 | claude-fable-5-2 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 22, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 62.1K, peak 117.1K, 0 above the auto threshold (80% of the serving model's window). Distribution: 43.4K, 43.7K, 43.7K, 44.2K, 46.1K, 50.5K, 51.0K, 54.5K, 54.5K, 55.0K, 55.4K, 56.1K, 57.0K, 57.3K, 57.3K, 57.4K, 59.0K, 59.5K, 59.6K, 60.5K, 61.6K, 62.0K, 62.0K, 62.1K, 62.8K, 63.8K, 64.0K, 64.1K, 64.4K, 65.6K, 66.3K, 68.5K, 71.5K, 72.3K, 73.4K, 73.4K, 75.2K, 87.1K, 93.0K, 95.5K, 95.6K, 98.7K, 104.4K, 106.9K, 109.4K, 117.1K.

**All runs:** 1 run(s), wall 43m30s (sum of per-run walls, idle time between runs excluded), 549 turns, 1056 tool calls, 407.6K output tokens, cache hit 0.966.

Turn classes across every bucket, read / edit / exec: 89/70/265 turns, 3.93/2.17/1.77 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 30m35s of round trip (command plus model time, ADR 0006 section 2): 70% of wall.

All runs: CI wait: 4m06s in `ci-poll.sh` calls; framework wall (wall less CI wait) 39m23s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
