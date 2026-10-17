# Run statistics, run

Generated 2026-10-17 20:31 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 45 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 1 | MCP verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Ingest the backlog and build the dependency graph | 4m22s | 8 | 21 | 3.0 | 5 | 4.0K | 86.5K | 106.9K | 0 | 0.835 | claude-fable-5-1 | 2/0/4 | 5.00/n/a/2.50 |  |
| 3.orchestrator (in 3) | Orchestrator: ingest and graph | 4m22s | 8 | 21 | 3.0 | 5 | 4.0K | 86.5K | 106.9K | 0 | 0.835 | claude-fable-5-1 | 2/0/4 | 5.00/n/a/2.50 |  |
| 4 | Resume detection | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Final report | 4m39s | 10 | 13 | 1.44 | 5 | 12.3K | 183.4K | 448.6K | 0 | 0.95 | claude-fable-5-1 | 1/0/7 | 5.00/n/a/1.00 |  |
| **run total** |  | 59m10s | 18 | 34 | 2.12 | 5 | 16.3K |  | 448.6K |  | 0.918 | claude-fable-5-1 | 3/0/11 (exec 10% of wall) | 5.00/n/a/1.55 |  |

Wall is this run's last step end minus its first step start; steps sum to 9m01s.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 6m10s of round trip (command plus model time, ADR 0006 section 2): 10% of wall.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0de5650a6a08322e | mayker-dev:builder | n/a | - (+6 outside) | 6 | 15 | 3.0 | 2/0/3 | 6.00/n/a/1.00 | 762 | 63.2K | 71.2K | 0.846 | claude-sonnet-5-5 |  |
| agent-a1259f577ddb86645 | mayker-dev:builder | n/a | - (+7 outside) | 7 | 11 | 1.83 | 1/2/3 | 5.00/1.50/1.00 | 1.1K | 53.0K | 57.9K | 0.879 | claude-sonnet-5-5 |  |
| agent-a133c821edd2e6c0d | mayker-dev:orchestrator | n/a | - (+4 outside) | 4 | 16 | 5.33 | 1/0/2 | 7.00/n/a/4.50 | 1.2K | 52.0K | 65.2K | 0.742 | claude-fable-5-1 |  |
| agent-a19c5c1c7387aeb9a | mayker-dev:builder | n/a | - (+8 outside) | 8 | 19 | 2.71 | 1/1/5 | 4.00/6.00/1.80 | 759 | 61.1K | 68.7K | 0.859 | claude-sonnet-5-5 |  |
| agent-a1ba4d4e8bd53126b | mayker-dev:orchestrator | n/a | - (+5 outside) | 5 | 11 | 2.75 | 1/0/3 | 4.00/n/a/2.33 | 931 | 56.9K | 65.7K | 0.769 | claude-fable-5-1 |  |
| agent-a20e2990a482dfdb6 | mayker-dev:orchestrator | n/a | - (+5 outside) | 5 | 13 | 3.25 | 1/0/3 | 4.00/n/a/3.00 | 908 | 61.2K | 73.9K | 0.758 | claude-fable-5-1 |  |
| agent-a2ee6d93a73054bf2 | mayker-dev:builder | n/a | - (+7 outside) | 7 | 14 | 2.33 | 2/1/3 | 4.00/2.00/1.33 | 1.1K | 59.0K | 67.6K | 0.868 | claude-sonnet-5-5 |  |
| agent-a30761300643f443a | mayker-dev:reviewer | n/a | - (+4 outside) | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 25 | 55.4K | 72.2K | 0.674 | claude-opus-5-5 |  |
| agent-a355c67effc724add | mayker-dev:reviewer | n/a | - (+4 outside) | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 29 | 46.5K | 56.8K | 0.694 | claude-opus-5-5 |  |
| agent-a3656a6f05a90d27d | mayker-dev:planner | n/a | - (+11 outside) | 11 | 24 | 2.4 | 2/0/7 | 3.00/n/a/1.86 | 136 | 80.8K | 99.8K | 0.901 | claude-opus-5-5 |  |
| agent-a3aae6ea8c0b0aa4b | mayker-dev:orchestrator | n/a | - (+4 outside) | 4 | 10 | 3.33 | 1/0/2 | 6.00/n/a/2.00 | 772 | 57.1K | 66.1K | 0.71 | claude-fable-5-1 |  |
| agent-a3faec602f68ee800 | mayker-dev:builder | n/a | - (+6 outside) | 6 | 14 | 2.8 | 2/0/3 | 5.50/n/a/1.00 | 1.3K | 52.8K | 59.0K | 0.855 | claude-sonnet-5-5 |  |
| agent-a409ae6f0474f85e4 | mayker-dev:builder | n/a | - (+5 outside) | 5 | 10 | 2.5 | 2/0/2 | 4.00/n/a/1.00 | 1.3K | 51.4K | 58.6K | 0.822 | claude-sonnet-5-5 |  |
| agent-a4ebde4b411987fdb | mayker-dev:reviewer | n/a | - (+3 outside) | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 18 | 49.2K | 71.1K | 0.58 | claude-opus-5-5 |  |
| agent-a4f593b381c1057d1 | mayker-dev:builder | n/a | - (+4 outside) | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 731 | 43.9K | 52.1K | 0.777 | claude-sonnet-5-5 |  |
| agent-a54612bbd0ade7369 | mayker-dev:builder | n/a | - (+5 outside) | 5 | 8 | 2.0 | 3/0/1 | 2.00/n/a/2.00 | 488 | 42.6K | 46.4K | 0.843 | claude-sonnet-5-5 |  |
| agent-a576cc63d2c6adbc2 | mayker-dev:builder | n/a | - (+7 outside) | 7 | 12 | 2.0 | 2/1/3 | 3.50/2.00/1.00 | 1.4K | 54.2K | 60.0K | 0.876 | claude-sonnet-5-5 |  |
| agent-a580fd1eefe0a7dc9 | mayker-dev:orchestrator | n/a | - (+5 outside) | 5 | 16 | 4.0 | 1/0/3 | 8.00/n/a/2.67 | 1.9K | 53.0K | 63.3K | 0.804 | claude-fable-5-1 |  |
| agent-a5896ff0b8b2eedf6 | mayker-dev:builder | n/a | - (+12 outside) | 12 | 22 | 2.0 | 0/1/9 | n/a/2.00/2.11 | 1.8K | 65.7K | 73.2K | 0.924 | claude-sonnet-5-5 |  |
| agent-a598dcd285a46581d | mayker-dev:reviewer | n/a | - (+4 outside) | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 23 | 50.9K | 65.2K | 0.68 | claude-opus-5-5 |  |
| agent-a5ffe485b6da0e936 | mayker-dev:builder | n/a | - (+14 outside) | 14 | 28 | 2.15 | 2/4/7 | 4.00/2.75/1.29 | 1.7K | 66.3K | 72.7K | 0.922 | claude-sonnet-5-5 |  |
| agent-a6c67dc239f9c9139 | mayker-dev:reviewer | n/a | - (+3 outside) | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 17 | 45.2K | 60.2K | 0.622 | claude-opus-5-5 |  |
| agent-a6ec11234c863727c | mayker-dev:orchestrator | n/a | - (+5 outside) | 5 | 15 | 3.75 | 2/0/2 | 5.00/n/a/2.50 | 1.3K | 57.3K | 66.4K | 0.768 | claude-fable-5-1 |  |
| agent-a7f3a18d194d6caca | mayker-dev:orchestrator | n/a | - (+6 outside) | 6 | 23 | 4.6 | 1/0/4 | 7.00/n/a/4.00 | 1.6K | 66.5K | 84.3K | 0.817 | claude-fable-5-1 |  |
| agent-a8067c2e4eb44aa0a | mayker-dev:orchestrator | n/a | - (+5 outside) | 5 | 13 | 3.25 | 1/0/3 | 4.00/n/a/3.00 | 902 | 62.0K | 73.2K | 0.801 | claude-fable-5-1 |  |
| agent-a8346bd76ca435b78 | mayker-dev:planner | n/a | - (+12 outside) | 12 | 26 | 2.36 | 1/0/9 | 2.00/n/a/2.11 | 2.6K | 85.9K | 100.6K | 0.914 | claude-opus-5-5 |  |
| agent-a83d391b86a5e23ab | mayker-dev:builder | n/a | - (+5 outside) | 5 | 9 | 2.25 | 1/1/2 | 5.00/2.00/1.00 | 1.0K | 51.3K | 56.7K | 0.83 | claude-sonnet-5-5 |  |
| agent-a845a8ad0e95cc7db | mayker-dev:builder | n/a | - (+16 outside) | 16 | 29 | 1.93 | 1/1/12 | 5.00/2.00/1.67 | 1.0K | 67.7K | 76.7K | 0.941 | claude-sonnet-5-5 |  |
| agent-a869395575941d4f2 | mayker-dev:builder | n/a | - (+2 outside) | 2 | 3 | 3.0 | 1/0/0 | 3.00/n/a/n/a | 411 | 39.7K | 45.0K | 0.597 | claude-sonnet-5-5 |  |
| agent-a87b42a08cd568366 | mayker-dev:planner | n/a | - (+18 outside) | 18 | 40 | 2.35 | 1/0/16 | 12.00/n/a/1.75 | 5.2K | 107.9K | 130.8K | 0.933 | claude-opus-5-5 |  |
| agent-a93726f986925e62f | mayker-dev:planner | n/a | - (+14 outside) | 14 | 25 | 1.92 | 1/0/11 | 3.00/n/a/1.27 | 3.0K | 84.5K | 98.5K | 0.917 | claude-opus-5-5 |  |
| agent-aaabe367b95f657d5 | mayker-dev:builder | n/a | - (+2 outside) | 2 | 4 | 4.0 | 1/0/0 | 4.00/n/a/n/a | 218 | 43.8K | 53.1K | 0.542 | claude-sonnet-5-5 |  |
| agent-aad0248870d823876 | mayker-dev:builder | n/a | - (+9 outside) | 9 | 28 | 3.5 | 2/2/4 | 6.00/6.00/1.00 | 853 | 67.8K | 76.8K | 0.895 | claude-sonnet-5-5 |  |
| agent-ab5d8f8b318720f27 | mayker-dev:builder | n/a | - (+7 outside) | 7 | 11 | 1.83 | 2/1/3 | 2.50/1.00/1.67 | 829 | 55.9K | 63.8K | 0.87 | claude-sonnet-5-5 |  |
| agent-ab8596775c8e183d4 | mayker-dev:orchestrator | deliver | 3 | 6 | 17 | 3.4 | 2/0/3 | 5.00/n/a/2.33 | 28 | 82.3K | 106.9K | 0.783 | claude-fable-5-1 |  |
| agent-ac174400b426fbbd8 | mayker-dev:orchestrator | n/a | - (+4 outside) | 4 | 11 | 3.67 | 1/0/2 | 6.00/n/a/2.50 | 1.0K | 58.3K | 68.9K | 0.754 | claude-fable-5-1 |  |
| agent-ac8d297503ec9589f | mayker-dev:builder | n/a | - (+4 outside) | 4 | 16 | 5.33 | 2/0/1 | 7.50/n/a/1.00 | 422 | 51.5K | 61.4K | 0.765 | claude-sonnet-5-5 |  |
| agent-adeb7a3ec4352eaf4 | mayker-dev:builder | n/a | - (+8 outside) | 8 | 19 | 2.71 | 2/2/3 | 3.50/3.50/1.67 | 1.1K | 64.2K | 71.9K | 0.885 | claude-sonnet-5-5 |  |
| agent-ae0b8fadbd0bb4deb | mayker-dev:orchestrator | n/a | - (+5 outside) | 5 | 18 | 4.5 | 1/0/2 | 1.00/n/a/4.50 | 20 | 51.6K | 61.3K | 0.807 | claude-fable-5-1 |  |
| agent-ae95410b08d268d5c | mayker-dev:builder | n/a | - (+8 outside) | 8 | 25 | 3.57 | 2/2/3 | 5.00/5.50/1.33 | 1.1K | 69.2K | 78.4K | 0.858 | claude-sonnet-5-5 |  |
| agent-aeb70a25d027b0a32 | mayker-dev:planner | n/a | - (+16 outside) | 16 | 35 | 2.33 | 2/0/13 | 7.00/n/a/1.62 | 1.9K | 105.0K | 133.4K | 0.921 | claude-opus-5-5 |  |
| agent-aec90b1571f18d0a1 | mayker-dev:orchestrator | deliver | 8 | 7 | 10 | 1.67 | 1/0/5 | 5.00/n/a/1.00 | 7.6K | 71.3K | 82.5K | 0.834 | claude-fable-5-1 |  |
| agent-af289f8798aa550f5 | mayker-dev:builder | n/a | - (+5 outside) | 5 | 11 | 2.75 | 2/0/2 | 4.50/n/a/1.00 | 1.3K | 49.2K | 54.5K | 0.831 | claude-sonnet-5-5 |  |
| agent-af4394b988af138d9 | mayker-dev:builder | n/a | - (+8 outside) | 8 | 13 | 1.86 | 2/2/3 | 3.50/1.50/1.00 | 1.0K | 59.6K | 66.2K | 0.889 | claude-sonnet-5-5 |  |
| agent-affac84986d971a2d | mayker-dev:builder | n/a | - (+15 outside) | 15 | 32 | 2.29 | 1/1/11 | 6.00/4.00/1.82 | 1.3K | 73.7K | 82.6K | 0.937 | claude-sonnet-5-5 |  |

**45 dispatch(es)** (mayker-dev:builder 23, mayker-dev:orchestrator 12, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 67.6K, peak 133.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 45.0K, 46.4K, 52.1K, 53.1K, 54.5K, 56.7K, 56.8K, 57.9K, 58.6K, 59.0K, 60.0K, 60.2K, 61.3K, 61.4K, 63.3K, 63.8K, 65.2K, 65.2K, 65.7K, 66.1K, 66.2K, 66.4K, 67.6K, 68.7K, 68.9K, 71.1K, 71.2K, 71.9K, 72.2K, 72.7K, 73.2K, 73.2K, 73.9K, 76.7K, 76.8K, 78.4K, 82.5K, 82.6K, 84.3K, 98.5K, 99.8K, 100.6K, 106.9K, 130.8K, 133.4K.

**All runs:** 1 run(s), wall 59m10s (sum of per-run walls, idle time between runs excluded), 508 turns, 1005 tool calls, 187.3K output tokens, cache hit 0.958.

Turn classes across every bucket, read / edit / exec: 76/22/302 turns, 4.79/3.09/1.69 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 58m04s of round trip (command plus model time, ADR 0006 section 2): 98% of wall.

490 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 73/22/291).

12 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/9).
