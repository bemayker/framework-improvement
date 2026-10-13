# Run statistics, run

Generated 2026-10-13 02:00 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 44 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 1 | MCP verification | 0m21s | 6 | 8 | 1.33 | 2 | 1.9K | 81.8K | 89.9K | 0 | 0.964 | claude-opus-5-5 | 0/0/5 | n/a/n/a/1.40 |  |
| 3 | Ingest the backlog | 3m02s | 18 | 24 | 1.5 | 7 | 6.2K | 94.3K | 138.9K | 0 | 0.923 | claude-opus-5-5 | 5/0/10 | 1.00/n/a/1.80 |  |
| 4 | Resume detection | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 5 | The scheduler loop | 50m49s | 467 | 931 | 2.31 | 19 | 187.6K | 164.2K | 474.0K | 0 | 0.962 | claude-opus-5-5 | 62/22/284 | 4.56/4.14/1.74 |  |
| 8 | Final report | 5m31s | 14 | 17 | 1.42 | 4 | 12.1K | 247.0K | 493.8K | 0 | 0.974 | claude-fable-5-1 | 1/0/10 | 4.00/n/a/1.20 |  |
| **run total** |  | 59m52s | 505 | 980 | 2.24 | 19 | 207.9K |  | 493.8K |  | 0.961 | claude-opus-5-5 | 68/22/309 | 4.29/4.14/1.72 |  |

Wall is this run's last step end minus its first step start; steps sum to 59m43s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a009172730df4951d | mayker-dev:reviewer | deliver | 5 | 3 | 22 | 11.0 | 2/0/0 | 11.00/n/a/n/a | 11 | 49.6K | 71.7K | 0.581 | claude-opus-5-5 |  |
| agent-a01085fea6c2f875d | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 7.00/5.00/1.00 | 1.1K | 61.3K | 68.2K | 0.85 | claude-sonnet-5-5 |  |
| agent-a03acd2663123fa8e | mayker-dev:orchestrator | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 17 | 40.1K | 46.4K | 0.781 | claude-fable-5-1 |  |
| agent-a068ddfbd64701a66 | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 2/2/4 | 3.00/2.00/1.50 | 1.0K | 62.4K | 68.7K | 0.878 | claude-sonnet-5-5 |  |
| agent-a14b53c6a2b5da7ec | mayker-dev:orchestrator | deliver | 8 | 8 | 12 | 1.71 | 1/0/6 | 4.00/n/a/1.33 | 2.7K | 67.6K | 81.2K | 0.87 | claude-fable-5-1 |  |
| agent-a1d1f0a46951b7bdc | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 6.00/3.00/1.00 | 695 | 57.4K | 64.6K | 0.85 | claude-sonnet-5-5 |  |
| agent-a3032627bbeb0bed8 | mayker-dev:reviewer | deliver | 5 | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 41 | 45.2K | 57.5K | 0.682 | claude-opus-5-5 |  |
| agent-a376f6352b9d04890 | mayker-dev:reviewer | deliver | 5 | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 39 | 49.5K | 62.9K | 0.73 | claude-opus-5-5 |  |
| agent-a3dfea4ba8590b313 | mayker-dev:builder | deliver | 5 | 3 | 9 | 4.5 | 2/0/0 | 4.50/n/a/n/a | 671 | 43.3K | 51.6K | 0.702 | claude-sonnet-5-5 |  |
| agent-a417148baab444bd4 | mayker-dev:builder | deliver | 5 | 12 | 27 | 2.45 | 1/3/7 | 6.00/3.00/1.71 | 2.9K | 62.9K | 68.9K | 0.926 | claude-sonnet-5-5 |  |
| agent-a419c5b90c9e76988 | mayker-dev:builder | deliver | 5 | 4 | 8 | 2.67 | 2/0/1 | 3.50/n/a/1.00 | 449 | 43.5K | 48.1K | 0.798 | claude-sonnet-5-5 |  |
| agent-a42456e82af45dc1a | mayker-dev:planner | deliver | 5 | 14 | 27 | 2.08 | 1/0/12 | 1.00/n/a/2.17 | 2.5K | 84.7K | 105.1K | 0.911 | claude-opus-5-5 |  |
| agent-a4d8c3ea9e5d7578c | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 2.00/2.00/2.67 | 1.2K | 60.4K | 68.5K | 0.847 | claude-sonnet-5-5 |  |
| agent-a5223c3ff88025036 | mayker-dev:builder | deliver | 5 | 13 | 26 | 2.17 | 1/1/8 | 3.00/4.00/2.00 | 1.5K | 61.8K | 68.5K | 0.931 | claude-sonnet-5-5 |  |
| agent-a56ae67079e33c6d7 | mayker-dev:orchestrator | deliver | 5 | 4 | 14 | 4.67 | 2/0/1 | 5.50/n/a/3.00 | 49 | 47.0K | 56.3K | 0.76 | claude-fable-5-1 |  |
| agent-a56cd87d07a957aee | mayker-dev:orchestrator | deliver | 5 | 4 | 14 | 4.67 | 2/0/1 | 6.50/n/a/1.00 | 15 | 66.6K | 81.1K | 0.738 | claude-fable-5-1 |  |
| agent-a5a9ef9c7966f42ef | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 381 | 37.8K | 41.4K | 0.748 | claude-sonnet-5-5 |  |
| agent-a6a39fd127a8d41b5 | mayker-dev:planner | deliver | 5 | 8 | 17 | 2.43 | 1/0/6 | 4.00/n/a/2.17 | 219 | 72.5K | 90.4K | 0.864 | claude-opus-5-5 |  |
| agent-a6ca7b9d8339e3ce4 | mayker-dev:builder | deliver | 5 | 3 | 8 | 4.0 | 2/0/0 | 4.00/n/a/n/a | 917 | 47.7K | 58.5K | 0.681 | claude-sonnet-5-5 |  |
| agent-a764cb4fc87e812c6 | mayker-dev:builder | deliver | 5 | 11 | 21 | 2.1 | 0/1/8 | n/a/3.00/2.00 | 2.2K | 67.5K | 76.0K | 0.915 | claude-sonnet-5-5 |  |
| agent-a7e67e1a736c11016 | mayker-dev:planner | deliver | 5 | 9 | 20 | 2.5 | 0/0/8 | n/a/n/a/2.50 | 1.5K | 79.0K | 97.2K | 0.863 | claude-opus-5-5 |  |
| agent-a8e115294df1d7cfa | mayker-dev:reviewer | deliver | 5 | 5 | 23 | 5.75 | 4/0/0 | 5.75/n/a/n/a | 45 | 54.5K | 69.8K | 0.744 | claude-opus-5-5 |  |
| agent-a90870ecb67087244 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 4.00/3.00/1.67 | 1.3K | 55.0K | 64.5K | 0.843 | claude-sonnet-5-5 |  |
| agent-a92102448599478ae | mayker-dev:orchestrator | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 2.00/n/a/1.00 | 9 | 38.5K | 41.9K | 0.637 | claude-fable-5-1 |  |
| agent-a94e50545bc506017 | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 3.33 | 1/0/2 | 8.00/n/a/1.00 | 2.2K | 60.2K | 72.0K | 0.701 | claude-fable-5-1 |  |
| agent-a96c4fdf9c086d783 | mayker-dev:orchestrator | deliver | 5 | 4 | 13 | 4.33 | 1/0/2 | 7.00/n/a/3.00 | 40 | 52.2K | 63.9K | 0.748 | claude-fable-5-1 |  |
| agent-a97cda80f3476174c | mayker-dev:reviewer | deliver | 5 | 4 | 17 | 5.67 | 3/0/0 | 5.67/n/a/n/a | 30 | 50.0K | 63.8K | 0.681 | claude-opus-5-5 |  |
| agent-a9b7a1fe98570cf0c | mayker-dev:orchestrator | deliver | 5 | 6 | 22 | 4.4 | 2/0/3 | 6.50/n/a/3.00 | 1.9K | 79.6K | 98.3K | 0.818 | claude-fable-5-1 |  |
| agent-a9cebf013b199f6da | mayker-dev:orchestrator | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 5 | 36.4K | 40.1K | 0.449 | claude-fable-5-1 |  |
| agent-a9f47968f4a0ecb39 | mayker-dev:orchestrator | deliver | 5 | 3 | 5 | 2.5 | 1/0/1 | 4.00/n/a/1.00 | 1.4K | 39.1K | 42.5K | 0.637 | claude-fable-5-1 |  |
| agent-aa1eb81956297ecec | mayker-dev:builder | deliver | 5 | 18 | 31 | 1.82 | 3/1/11 | 3.33/2.00/1.45 | 1.7K | 70.2K | 81.0K | 0.946 | claude-sonnet-5-5 |  |
| agent-aa78df2bf236a1386 | mayker-dev:planner | deliver | 5 | 14 | 29 | 2.23 | 2/0/10 | 4.00/n/a/1.70 | 188 | 92.1K | 119.4K | 0.907 | claude-opus-5-5 |  |
| agent-aa833760420a5dab3 | mayker-dev:planner | deliver | 5 | 10 | 23 | 2.56 | 0/0/8 | n/a/n/a/2.12 | 3.4K | 86.8K | 110.7K | 0.872 | claude-opus-5-5 |  |
| agent-aaab0e12ae694c0b3 | mayker-dev:planner | deliver | 5 | 9 | 20 | 2.5 | 0/0/7 | n/a/n/a/2.00 | 3.0K | 77.6K | 97.3K | 0.877 | claude-opus-5-5 |  |
| agent-abadd384771e640d2 | mayker-dev:builder | deliver | 5 | 5 | 6 | 1.5 | 1/1/2 | 1.00/1.00/2.00 | 1.0K | 41.2K | 43.9K | 0.85 | claude-sonnet-5-5 |  |
| agent-ac643ef0968c6ce28 | mayker-dev:orchestrator | deliver | 3 | 8 | 13 | 1.86 | 1/0/6 | 1.00/n/a/2.00 | 410 | 63.8K | 81.9K | 0.839 | claude-fable-5-1 |  |
| agent-ac80b5a92660b4c76 | mayker-dev:builder | deliver | 5 | 9 | 27 | 3.38 | 1/3/4 | 8.00/3.33/2.25 | 1.4K | 75.4K | 85.3K | 0.874 | claude-sonnet-5-5 |  |
| agent-aca065386a432ba4b | mayker-dev:orchestrator | deliver | 5 | 11 | 22 | 2.2 | 2/0/8 | 5.50/n/a/1.38 | 1.3K | 65.6K | 79.4K | 0.905 | claude-fable-5-1 |  |
| agent-adb0d9e3b5f27b434 | mayker-dev:orchestrator | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 16 | 36.5K | 40.2K | 0.605 | claude-fable-5-1 |  |
| agent-adb95c018b60b93df | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 1/1/4 | 5.00/4.00/3.50 | 1.7K | 65.9K | 75.3K | 0.865 | claude-sonnet-5-5 |  |
| agent-ae90ce3ec4dfbdd7f | mayker-dev:builder | deliver | 5 | 9 | 41 | 5.12 | 1/1/6 | 10.00/19.00/2.00 | 1.2K | 69.9K | 84.9K | 0.886 | claude-sonnet-5-5 |  |
| agent-aecbed41092a80d35 | mayker-dev:builder | deliver | 5 | 8 | 18 | 2.57 | 1/2/4 | 2.00/3.50/2.25 | 1.8K | 66.4K | 75.2K | 0.883 | claude-sonnet-5-5 |  |
| agent-af9f73ced9c84a312 | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 2.00/2.00/2.33 | 1.0K | 52.4K | 58.7K | 0.854 | claude-sonnet-5-5 |  |
| agent-afc3dd8ba8ca978d9 | mayker-dev:builder | deliver | 5 | 9 | 28 | 3.5 | 1/1/6 | 4.00/13.00/1.83 | 1.1K | 66.9K | 75.6K | 0.874 | claude-sonnet-5-5 |  |

**44 dispatch(es)** (mayker-dev:builder 20, mayker-dev:orchestrator 13, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 68.8K, peak 119.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 40.1K, 40.2K, 41.4K, 41.9K, 42.5K, 43.9K, 46.4K, 48.1K, 51.6K, 56.3K, 57.5K, 58.5K, 58.7K, 62.9K, 63.8K, 63.9K, 64.5K, 64.6K, 68.2K, 68.5K, 68.5K, 68.7K, 68.9K, 69.8K, 71.7K, 72.0K, 75.2K, 75.3K, 75.6K, 76.0K, 79.4K, 81.0K, 81.1K, 81.2K, 81.9K, 84.9K, 85.3K, 90.4K, 97.2K, 97.3K, 98.3K, 105.1K, 110.7K, 119.4K.

**All runs:** 1 run(s), wall 59m52s (sum of per-run walls, idle time between runs excluded), 505 turns, 980 tool calls, 207.9K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 68/22/309 turns, 4.29/4.14/1.72 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

5 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/3).
