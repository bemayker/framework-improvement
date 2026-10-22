# Run statistics, run

Generated 2026-10-22 04:07 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 48 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Ingest the backlog | 58m17s | 551 | 1018 | 2.12 | 13 | 169.3K | 138.1K | 424.3K | 3 | 0.959 | claude-opus-5-5 | 77/69/301 | 3.96/2.14/1.69 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 3m04s | 9 | 22 | 2.75 | 6 | 4.2K | 70.8K | 87.9K | 0 | 0.856 | claude-fable-5-1 | 1/1/5 | 4.00/2.00/3.00 |  |
| 3.orchestrator #2 (in 3) | Re-ingestion dispatch | 3m54s | 61 | 99 | 1.94 | 7 | 13.6K | 127.4K | 332.0K | 0 | 0.961 | claude-sonnet-5-5 | 8/6/32 | 3.38/2.33/1.66 |  |
| 3.orchestrator #3 (in 3) | Re-ingestion dispatch | 2m03s | 34 | 60 | 2.31 | 9 | 10.2K | 174.6K | 392.5K | 0 | 0.96 | claude-opus-5-5 | 6/3/14 | 5.17/1.33/1.57 |  |
| 3.orchestrator #4 (in 3) | Re-ingestion dispatch | 2m04s | 10 | 17 | 1.89 | 4 | 4.4K | 136.5K | 424.3K | 0 | 0.939 | claude-fable-5-1 | 1/1/6 | 4.00/2.00/1.67 |  |
| 8 | Final report | 6m24s | 12 | 15 | 1.36 | 5 | 12.5K | 189.1K | 449.9K | 0 | 0.959 | claude-fable-5-1 | 3/3/4 | 2.33/1.00/1.00 |  |
| **run total** |  | 1h06m | 563 | 1033 | 2.1 | 13 | 181.8K |  | 449.9K |  | 0.959 | claude-opus-5-5 | 80/72/305 (exec 89% of wall) | 3.90/2.10/1.68 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h04m.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 3)`, `3.orchestrator #3 (in 3)`, `3.orchestrator #4 (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 58m33s of round trip (command plus model time, ADR 0006 section 2): 89% of wall.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a01ca731e4a473821 | mayker-dev:builder | deliver | 3 | 7 | 14 | 2.33 | 2/2/2 | 3.00/3.00/1.00 | 1.4K | 61.3K | 70.7K | 0.835 | claude-sonnet-5-5 |  |
| agent-a03946e3f40ed49b9 | mayker-dev:builder | deliver | 3 | 6 | 15 | 3.0 | 2/1/2 | 5.50/2.00/1.00 | 1.2K | 51.6K | 57.3K | 0.857 | claude-sonnet-5-5 |  |
| agent-a08e046c02523a100 | mayker-dev:builder | deliver | 3 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 369 | 38.3K | 42.6K | 0.613 | claude-sonnet-5-5 |  |
| agent-a0c0d5136dd826ba8 | mayker-dev:builder | deliver | 3 | 10 | 13 | 1.44 | 2/2/5 | 2.00/1.50/1.20 | 1.1K | 54.0K | 60.6K | 0.912 | claude-sonnet-5-5 |  |
| agent-a0c166bf22155ce7f | mayker-dev:builder | deliver | 3 | 7 | 23 | 3.83 | 1/1/4 | 4.00/10.00/2.25 | 1.6K | 62.8K | 72.0K | 0.866 | claude-sonnet-5-5 |  |
| agent-a0c6b78493c865b05 | mayker-dev:builder | deliver | 3 | 7 | 10 | 1.67 | 2/1/3 | 2.00/2.00/1.33 | 878 | 51.7K | 60.1K | 0.87 | claude-sonnet-5-5 |  |
| agent-a0cb290bd5888a588 | mayker-dev:builder | deliver | 3 | 11 | 16 | 1.6 | 2/3/5 | 3.00/1.33/1.20 | 2.4K | 63.3K | 70.7K | 0.917 | claude-sonnet-5-5 |  |
| agent-a0def1261c4227b57 | mayker-dev:orchestrator | deliver | 3 | 7 | 16 | 2.67 | 2/1/3 | 4.50/2.00/1.67 | 1.7K | 53.8K | 60.3K | 0.872 | claude-fable-5-1 |  |
| agent-a1977949032f2b755 | mayker-dev:builder | deliver | 3 | 3 | 3 | 1.5 | 1/0/1 | 1.00/n/a/2.00 | 368 | 38.6K | 44.9K | 0.724 | claude-sonnet-5-5 |  |
| agent-a1bdf6e443990331b | mayker-dev:orchestrator | deliver | 3 | 8 | 14 | 2.0 | 1/1/4 | 4.00/2.00/1.75 | 2.3K | 64.9K | 79.1K | 0.847 | claude-fable-5-1 |  |
| agent-a2529f6b5889496ca | mayker-dev:builder | deliver | 3 | 8 | 11 | 1.57 | 2/1/4 | 2.00/3.00/1.00 | 925 | 48.1K | 55.7K | 0.889 | claude-sonnet-5-5 |  |
| agent-a2c87804fcc77f45e | mayker-dev:builder | deliver | 3 | 10 | 15 | 1.67 | 2/4/3 | 3.00/1.50/1.00 | 1.4K | 54.2K | 58.9K | 0.915 | claude-sonnet-5-5 |  |
| agent-a3e298633724bedc4 | mayker-dev:reviewer | deliver | 3 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 40 | 45.0K | 60.4K | 0.553 | claude-opus-5-5 |  |
| agent-a424d56c8ece0f49b | mayker-dev:orchestrator | deliver | 3 | 6 | 10 | 2.0 | 1/1/3 | 4.00/1.00/1.67 | 1.2K | 44.8K | 48.5K | 0.819 | claude-fable-5-1 |  |
| agent-a42cadbeddc3613dd | mayker-dev:builder | deliver | 3 | 3 | 3 | 1.5 | 1/0/1 | 1.00/n/a/2.00 | 345 | 36.4K | 38.3K | 0.768 | claude-sonnet-5-5 |  |
| agent-a45f7670c608b3e17 | mayker-dev:builder | deliver | 3 | 7 | 22 | 3.67 | 2/2/2 | 4.00/5.50/1.50 | 859 | 64.3K | 73.5K | 0.866 | claude-sonnet-5-5 |  |
| agent-a468f1cec7884bd5a | mayker-dev:planner | deliver | 3 | 10 | 25 | 2.78 | 0/1/8 | n/a/2.00/2.88 | 112 | 92.5K | 118.6K | 0.872 | claude-opus-5-5 |  |
| agent-a55b4524b03ba5669 | mayker-dev:orchestrator | deliver | 3 | 6 | 11 | 2.2 | 1/1/3 | 7.00/1.00/1.00 | 974 | 49.3K | 54.0K | 0.859 | claude-fable-5-1 |  |
| agent-a5f5dfb35f1855093 | mayker-dev:builder | deliver | 3 | 9 | 14 | 1.75 | 2/2/4 | 3.50/1.50/1.00 | 1.4K | 50.7K | 54.8K | 0.908 | claude-sonnet-5-5 |  |
| agent-a64c1a6911574240f | mayker-dev:reviewer | deliver | 3 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 24 | 51.2K | 67.6K | 0.67 | claude-opus-5-5 |  |
| agent-a73beea80e14adcb5 | mayker-dev:reviewer | deliver | 3 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 43 | 42.6K | 53.7K | 0.579 | claude-opus-5-5 |  |
| agent-a7e4174dd8e5fe5d5 | mayker-dev:planner | deliver | 3 | 12 | 28 | 2.55 | 1/2/7 | 6.00/1.50/2.00 | 311 | 86.8K | 101.7K | 0.914 | claude-opus-5-5 |  |
| agent-a870512664686280f | mayker-dev:builder | deliver | 3 | 6 | 12 | 2.4 | 2/1/2 | 4.50/1.00/1.00 | 986 | 60.1K | 67.4K | 0.849 | claude-sonnet-5-5 |  |
| agent-a9328c267576a62f1 | mayker-dev:orchestrator | deliver | 3 | 6 | 10 | 2.0 | 1/1/3 | 4.00/1.00/1.67 | 1.2K | 43.9K | 47.2K | 0.82 | claude-fable-5-1 |  |
| agent-a9b80214d665aa50d | mayker-dev:builder | deliver | 3 | 18 | 29 | 1.71 | 2/1/13 | 2.50/1.00/1.69 | 1.3K | 68.3K | 77.2K | 0.948 | claude-sonnet-5-5 |  |
| agent-a9c64406b0c360cb4 | mayker-dev:builder | deliver | 3 | 4 | 4 | 1.33 | 0/0/3 | n/a/n/a/1.33 | 533 | 40.1K | 49.5K | 0.772 | claude-sonnet-5-5 |  |
| agent-aa2cf64a4d95f9149 | mayker-dev:planner | deliver | 3 | 9 | 21 | 2.62 | 0/2/6 | n/a/1.50/3.00 | 1.4K | 85.9K | 104.6K | 0.865 | claude-opus-5-5 |  |
| agent-aa57c1cd99eeca82f | mayker-dev:planner | deliver | 3 | 13 | 33 | 2.75 | 2/1/8 | 3.50/2.00/2.00 | 127 | 93.6K | 117.4K | 0.903 | claude-opus-5-5 |  |
| agent-aa5df8d0f76551c1b | mayker-dev:orchestrator | deliver | 3 | 8 | 12 | 1.71 | 1/1/5 | 3.00/1.00/1.60 | 1.3K | 48.9K | 56.4K | 0.887 | claude-fable-5-1 |  |
| agent-aaab05bf7e18168a9 | mayker-dev:orchestrator | deliver | 3 | 8 | 22 | 3.14 | 1/1/4 | 7.00/1.00/3.25 | 2.0K | 54.7K | 61.4K | 0.888 | claude-fable-5-1 |  |
| agent-aad22867b4083926b | mayker-dev:orchestrator | deliver | 3 | 7 | 16 | 2.67 | 1/1/4 | 4.00/2.00/2.50 | 2.4K | 65.5K | 81.3K | 0.849 | claude-fable-5-1 |  |
| agent-aad8ab347b82de800 | mayker-dev:orchestrator | deliver | 3 | 7 | 18 | 3.0 | 1/1/4 | 4.00/2.00/3.00 | 2.3K | 69.6K | 87.9K | 0.819 | claude-fable-5-1 |  |
| agent-aafeaba496aeef6f5 | mayker-dev:orchestrator | deliver | 8 | 8 | 11 | 1.57 | 3/2/2 | 2.33/1.00/1.00 | 293 | 64.3K | 83.4K | 0.864 | claude-fable-5-1 |  |
| agent-ab2f5bbea82586ee3 | mayker-dev:orchestrator | deliver | 3 | 10 | 23 | 2.56 | 1/2/6 | 4.00/2.00/2.50 | 2.4K | 79.0K | 97.7K | 0.892 | claude-fable-5-1 |  |
| agent-abc6e8475e42a02b9 | mayker-dev:orchestrator | deliver | 3 | 6 | 16 | 3.2 | 3/1/1 | 3.33/2.00/4.00 | 2.5K | 51.1K | 57.3K | 0.813 | claude-fable-5-1 |  |
| agent-ac0ab24df384832c2 | mayker-dev:builder | deliver | 3 | 7 | 9 | 1.5 | 2/1/3 | 2.00/2.00/1.00 | 802 | 45.9K | 51.7K | 0.879 | claude-sonnet-5-5 |  |
| agent-ac481c07a016ac7df | mayker-dev:orchestrator | deliver | 3 | 7 | 9 | 1.5 | 2/1/3 | 2.50/1.00/1.00 | 1.2K | 43.4K | 47.3K | 0.885 | claude-fable-5-1 |  |
| agent-acce24059bd058fa7 | mayker-dev:orchestrator | deliver | 3 | 5 | 9 | 2.25 | 1/1/2 | 4.00/2.00/1.50 | 1.2K | 44.6K | 50.2K | 0.83 | claude-fable-5-1 |  |
| agent-ad0b3eef0114fba4a | mayker-dev:builder | deliver | 3 | 7 | 16 | 2.67 | 1/2/3 | 4.00/2.00/2.67 | 1.0K | 56.3K | 64.0K | 0.87 | claude-sonnet-5-5 |  |
| agent-ad4d3ebe29d751450 | mayker-dev:reviewer | deliver | 3 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 26 | 52.6K | 69.1K | 0.715 | claude-opus-5-5 |  |
| agent-add8b8f68684a4045 | mayker-dev:orchestrator | deliver | 3 | 6 | 13 | 2.6 | 2/1/2 | 4.50/2.00/1.00 | 1.5K | 51.6K | 56.8K | 0.856 | claude-fable-5-1 |  |
| agent-ade2c2618bd3ce268 | mayker-dev:planner | deliver | 3 | 15 | 35 | 2.5 | 1/2/11 | 5.00/1.00/2.55 | 1.5K | 105.1K | 125.8K | 0.928 | claude-opus-5-5 |  |
| agent-adffa28380d456d75 | mayker-dev:builder | deliver | 3 | 11 | 18 | 1.8 | 2/1/6 | 3.00/2.00/1.50 | 1.4K | 62.2K | 67.9K | 0.92 | claude-sonnet-5-5 |  |
| agent-ae04275604edd060a | mayker-dev:builder | deliver | 3 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 400 | 38.5K | 43.0K | 0.61 | claude-sonnet-5-5 |  |
| agent-ae90d46479711d332 | mayker-dev:builder | deliver | 3 | 9 | 33 | 4.12 | 2/2/4 | 6.50/8.00/1.00 | 1.6K | 69.1K | 78.0K | 0.895 | claude-sonnet-5-5 |  |
| agent-aee55f8c910b2daaf | mayker-dev:reviewer | deliver | 3 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 19 | 52.8K | 69.2K | 0.716 | claude-opus-5-5 |  |
| agent-afbc78cfb4c196244 | mayker-dev:builder | deliver | 3 | 6 | 15 | 3.0 | 2/1/2 | 4.00/5.00/1.00 | 813 | 56.4K | 66.8K | 0.803 | claude-sonnet-5-5 |  |
| agent-afdbe87486b655e82 | mayker-dev:builder | deliver | 3 | 13 | 27 | 2.25 | 1/1/9 | 4.00/3.00/2.11 | 1.3K | 66.9K | 74.4K | 0.929 | claude-sonnet-5-5 |  |

**48 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 15, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 62.7K, peak 125.8K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.3K, 42.6K, 43.0K, 44.9K, 47.2K, 47.3K, 48.5K, 49.5K, 50.2K, 51.7K, 53.7K, 54.0K, 54.8K, 55.7K, 56.4K, 56.8K, 57.3K, 57.3K, 58.9K, 60.1K, 60.3K, 60.4K, 60.6K, 61.4K, 64.0K, 66.8K, 67.4K, 67.6K, 67.9K, 69.1K, 69.2K, 70.7K, 70.7K, 72.0K, 73.5K, 74.4K, 77.2K, 78.0K, 79.1K, 81.3K, 83.4K, 87.9K, 97.7K, 101.7K, 104.6K, 117.4K, 118.6K, 125.8K.

**All runs:** 1 run(s), wall 1h06m (sum of per-run walls, idle time between runs excluded), 565 turns, 1035 tool calls, 183.4K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 80/72/307 turns, 3.90/2.10/1.68 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 1h00m of round trip (command plus model time, ADR 0006 section 2): 91% of wall.

2 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 0/0/2).

12 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/9).
