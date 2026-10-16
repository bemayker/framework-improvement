# Run statistics, run

Generated 2026-10-16 05:27 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 43 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 1 | MCP verification | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Ingest the backlog and build the dependency graph | 4m11s | 10 | 23 | 2.56 | 6 | 7.9K | 99.4K | 135.9K | 0 | 0.897 | claude-fable-5-1 | 1/0/7 | 5.00/n/a/2.43 |  |
| 4 | Resume detection | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 5 | Scheduler loop | 46m48s | 502 | 887 | 2.01 | 14 | 183.3K | 176.2K | 492.8K | 0 | 0.968 | claude-opus-5-5 | 80/17/301 | 4.04/3.71/1.49 |  |
| 8 | Final report | 2m54s | 8 | 9 | 1.29 | 3 | 11.3K | 225.2K | 502.2K | 0 | 0.962 | claude-fable-5-1 | 0/0/6 | n/a/n/a/1.33 |  |
| **run total** |  | 53m53s | 520 | 919 | 2.01 | 14 | 202.5K |  | 502.2K |  | 0.967 | claude-opus-5-5 | 81/17/314 | 4.05/3.71/1.51 |  |

Wall is this run's last step end minus its first step start; steps sum to 53m53s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a00e6f726fee17a42 | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 2/0/5 | 3.50/n/a/2.00 | 176 | 54.9K | 76.0K | 0.827 | claude-fable-5-1 |  |
| agent-a11ae32176bec19b3 | mayker-dev:orchestrator | deliver | 5 | 4 | 5 | 1.67 | 0/0/3 | n/a/n/a/1.67 | 1.2K | 39.8K | 42.6K | 0.732 | claude-fable-5-1 |  |
| agent-a1db2b0a50a8c07bb | mayker-dev:orchestrator | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 9 | 38.4K | 42.3K | 0.448 | claude-fable-5-1 |  |
| agent-a234177115d500747 | mayker-dev:orchestrator | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 10 | 37.1K | 41.1K | 0.598 | claude-fable-5-1 |  |
| agent-a2b94e78fdfb7e5cb | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 4.50/3.00/1.00 | 1.1K | 61.7K | 72.0K | 0.863 | claude-sonnet-5-5 |  |
| agent-a2cdac1754666c76c | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 1/1/1 | 4.00/1.00/1.00 | 721 | 50.9K | 56.8K | 0.784 | claude-sonnet-5-5 |  |
| agent-a39dac0694a07e267 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 3/1/3 | 3.00/2.00/1.00 | 1.4K | 58.5K | 66.4K | 0.885 | claude-sonnet-5-5 |  |
| agent-a3ed93fc22449e8be | mayker-dev:orchestrator | deliver | 8 | 5 | 6 | 1.5 | 0/0/4 | n/a/n/a/1.50 | 5.2K | 61.9K | 72.3K | 0.807 | claude-fable-5-1 |  |
| agent-a4277d0b14fd49785 | mayker-dev:builder | deliver | 5 | 12 | 20 | 1.82 | 1/1/9 | 3.00/2.00/1.67 | 1.2K | 59.3K | 65.5K | 0.926 | claude-sonnet-5-5 |  |
| agent-a4b0a870473bccec8 | mayker-dev:builder | deliver | 5 | 5 | 15 | 3.75 | 2/0/2 | 5.50/n/a/2.00 | 648 | 48.3K | 54.6K | 0.826 | claude-sonnet-5-5 |  |
| agent-a4b62245279cfce70 | mayker-dev:builder | deliver | 5 | 6 | 28 | 5.6 | 1/2/2 | 10.00/6.50/2.50 | 673 | 65.2K | 76.8K | 0.836 | claude-sonnet-5-5 |  |
| agent-a564945017ce0ac16 | mayker-dev:orchestrator | deliver | 5 | 3 | 6 | 3.0 | 1/0/1 | 4.00/n/a/2.00 | 14 | 49.4K | 58.6K | 0.68 | claude-fable-5-1 |  |
| agent-a57af518e9b8f09e9 | mayker-dev:builder | deliver | 5 | 6 | 22 | 4.4 | 2/1/2 | 5.00/10.00/1.00 | 1.3K | 66.3K | 77.1K | 0.838 | claude-sonnet-5-5 |  |
| agent-a5c6a492863ba8d48 | mayker-dev:orchestrator | deliver | 5 | 4 | 8 | 2.67 | 1/0/2 | 1.00/n/a/3.50 | 141 | 47.0K | 61.5K | 0.732 | claude-fable-5-1 |  |
| agent-a5e18c42f72cb7d4c | mayker-dev:builder | deliver | 5 | 8 | 24 | 3.43 | 2/1/4 | 4.50/9.00/1.50 | 1.0K | 62.9K | 70.5K | 0.86 | claude-sonnet-5-5 |  |
| agent-a6602c1bd05f46278 | mayker-dev:builder | deliver | 5 | 11 | 22 | 2.2 | 1/2/7 | 7.00/4.00/1.00 | 1.7K | 67.8K | 74.3K | 0.9 | claude-sonnet-5-5 |  |
| agent-a6654812e45f13d4e | mayker-dev:reviewer | deliver | 5 | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 42 | 47.4K | 57.8K | 0.695 | claude-opus-5-5 |  |
| agent-a6684e7cf5b8e4831 | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 3/1/4 | 3.67/3.00/2.50 | 841 | 66.6K | 75.7K | 0.895 | claude-sonnet-5-5 |  |
| agent-a6cf5ab2c9857b78b | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 2/0/3 | 4.00/n/a/2.67 | 4.1K | 57.3K | 76.4K | 0.81 | claude-fable-5-1 |  |
| agent-a7661b6816ca65178 | mayker-dev:builder | deliver | 5 | 13 | 24 | 2.0 | 2/1/9 | 3.00/2.00/1.78 | 1.6K | 70.3K | 80.3K | 0.926 | claude-sonnet-5-5 |  |
| agent-a82d2f0c7695efef8 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 1/1/5 | 4.00/2.00/1.00 | 1.4K | 50.4K | 55.1K | 0.895 | claude-sonnet-5-5 |  |
| agent-a877b51f3a3f98999 | mayker-dev:planner | deliver | 5 | 17 | 36 | 2.25 | 2/0/14 | 6.00/n/a/1.71 | 1.9K | 97.4K | 119.9K | 0.928 | claude-opus-5-5 |  |
| agent-a982c69386463d085 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 1/1/4 | 5.00/2.00/1.25 | 1.1K | 63.5K | 70.9K | 0.869 | claude-sonnet-5-5 |  |
| agent-a9f98d96a492d3cbc | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 25 | 53.9K | 69.8K | 0.718 | claude-opus-5-5 |  |
| agent-aa0ef90e44396ca4b | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 28 | 50.6K | 65.0K | 0.679 | claude-opus-5-5 |  |
| agent-aa353f204bc459fcd | mayker-dev:planner | deliver | 5 | 20 | 30 | 1.58 | 3/0/16 | 3.67/n/a/1.19 | 6.7K | 90.8K | 106.7K | 0.941 | claude-opus-5-5 |  |
| agent-acb2161cd122040bf | mayker-dev:planner | deliver | 5 | 12 | 17 | 1.55 | 1/0/10 | 5.00/n/a/1.20 | 7.2K | 65.1K | 74.8K | 0.919 | claude-opus-5-5 |  |
| agent-aced9c26d81515a90 | mayker-dev:reviewer | deliver | 5 | 5 | 18 | 4.5 | 4/0/0 | 4.50/n/a/n/a | 275 | 55.5K | 68.8K | 0.752 | claude-opus-5-5 |  |
| agent-ad1e089b9addd05ab | mayker-dev:planner | deliver | 5 | 13 | 23 | 1.92 | 3/0/9 | 2.00/n/a/1.89 | 2.1K | 88.9K | 106.7K | 0.918 | claude-opus-5-5 |  |
| agent-ad41b8f4373718a0b | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 2/0/4 | 4.00/n/a/3.00 | 557 | 50.5K | 60.5K | 0.86 | claude-fable-5-1 |  |
| agent-ad8379a3e88158921 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 16 | 52.8K | 68.2K | 0.72 | claude-opus-5-5 |  |
| agent-adafe0dca76b23f53 | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 5.00/2.00/1.00 | 1.2K | 49.9K | 54.9K | 0.831 | claude-sonnet-5-5 |  |
| agent-adb33436405f5a42e | mayker-dev:builder | deliver | 5 | 5 | 10 | 2.5 | 2/0/2 | 4.00/n/a/1.00 | 1.3K | 47.7K | 54.0K | 0.827 | claude-sonnet-5-5 |  |
| agent-ae23b32221394f4dc | mayker-dev:planner | deliver | 5 | 16 | 21 | 1.4 | 0/0/15 | n/a/n/a/1.40 | 2.1K | 86.3K | 102.8K | 0.926 | claude-opus-5-5 |  |
| agent-ae53f7fa970e11f14 | mayker-dev:planner | deliver | 5 | 14 | 28 | 2.15 | 1/0/12 | 4.00/n/a/2.00 | 257 | 96.6K | 118.8K | 0.921 | claude-opus-5-5 |  |
| agent-ae6e3221060fc61a3 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.00/2.00/1.00 | 680 | 69.6K | 78.4K | 0.812 | claude-sonnet-5-5 |  |
| agent-aef71bef1ae0b2438 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 2/0/3 | 4.00/n/a/2.00 | 152 | 55.8K | 76.0K | 0.772 | claude-fable-5-1 |  |
| agent-af1434522ed5d3f30 | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.75 | 1/0/3 | 5.00/n/a/2.00 | 712 | 44.6K | 49.0K | 0.838 | claude-sonnet-5-5 |  |
| agent-af3a7ba1abd9bf518 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 2/0/2 | 6.00/n/a/1.00 | 1.5K | 51.7K | 58.6K | 0.823 | claude-sonnet-5-5 |  |
| agent-af4cb3d40dad38790 | mayker-dev:orchestrator | deliver | 5 | 4 | 10 | 3.33 | 1/0/2 | 1.00/n/a/4.50 | 68 | 50.7K | 67.1K | 0.724 | claude-fable-5-1 |  |
| agent-af751c49a57132b3d | mayker-dev:orchestrator | deliver | 3 | 6 | 18 | 3.6 | 1/0/4 | 5.00/n/a/3.25 | 3.3K | 76.7K | 94.1K | 0.795 | claude-fable-5-1 |  |
| agent-af8f47ad592b61626 | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 4.00/2.00/1.00 | 1.1K | 50.7K | 55.9K | 0.83 | claude-sonnet-5-5 |  |
| agent-afb4232120a1b3051 | mayker-dev:orchestrator | deliver | 5 | 3 | 5 | 2.5 | 1/0/1 | 3.00/n/a/2.00 | 1.1K | 39.6K | 43.9K | 0.725 | claude-fable-5-1 |  |

**43 dispatch(es)** (mayker-dev:builder 19, mayker-dev:orchestrator 13, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 68.8K, peak 119.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 41.1K, 42.3K, 42.6K, 43.9K, 49.0K, 54.0K, 54.6K, 54.9K, 55.1K, 55.9K, 56.8K, 57.8K, 58.6K, 58.6K, 60.5K, 61.5K, 65.0K, 65.5K, 66.4K, 67.1K, 68.2K, 68.8K, 69.8K, 70.5K, 70.9K, 72.0K, 72.3K, 74.3K, 74.8K, 75.7K, 76.0K, 76.0K, 76.4K, 76.8K, 77.1K, 78.4K, 80.3K, 94.1K, 102.8K, 106.7K, 106.7K, 118.8K, 119.9K.

**All runs:** 1 run(s), wall 53m53s (sum of per-run walls, idle time between runs excluded), 520 turns, 919 tool calls, 202.5K output tokens, cache hit 0.967.

Turn classes across every bucket, read / edit / exec: 81/17/314 turns, 4.05/3.71/1.51 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

12 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 5/0/5).
