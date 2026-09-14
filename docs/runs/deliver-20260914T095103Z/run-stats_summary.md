# Run statistics, run

Generated 2026-09-14 10:46 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 23 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-09-02; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog and build the dependency graph | 3m58s | 23 | 50 | 2.38 | 7 | 21.3K | 158.0K | 226.8K | 0 | 0.844 | claude-fable-5-1 | 3/0/16 | 2.00/n/a/2.38 |  |
| 5 | Scheduler loop | 2h02m | 309 | 493 | 1.79 | 8 | 142.8K | 256.5K | 457.8K | 0 | 0.951 | claude-opus-5 | 26/15/217 | 4.88/1.87/1.47 |  |
| 8 | Final report | n/a | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 2h06m | 332 | 543 | 1.83 | 8 | 164.2K |  | 457.8K |  | 0.946 | claude-opus-5 | 29/15/233 | 4.59/1.87/1.53 |  |

Wall is this run's last step end minus its first step start; steps sum to 2h06m.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a083355f603b2a7b3 | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 0/0/6 | n/a/n/a/2.00 | 26 | 180.2K | 201.6K | 0.865 | claude-opus-5 |  |
| agent-a1ee07ccd3a6922a9 | mayker-dev:reviewer | deliver | 5 | 5 | 24 | 6.0 | 4/0/0 | 6.00/n/a/n/a | 20 | 169.6K | 211.0K | 0.751 | claude-opus-5 |  |
| agent-a1f85f7a3361ed809 | mayker-dev:builder | deliver | 5 | 15 | 22 | 1.57 | 2/5/7 | 4.00/1.20/1.14 | 3.1K | 194.7K | 208.9K | 0.939 | claude-opus-5 |  |
| agent-a2dec2d2eb906e997 | mayker-dev:orchestrator | deliver | 3 | 5 | 11 | 2.75 | 1/0/3 | 1.00/n/a/3.33 | 16 | 137.0K | 155.5K | 0.812 | claude-fable-5-1 |  |
| agent-a3b91f12bfa906b4b | mayker-dev:reviewer | deliver | 5 | 5 | 23 | 5.75 | 4/0/0 | 5.75/n/a/n/a | 21 | 166.7K | 201.3K | 0.758 | claude-opus-5 |  |
| agent-a49fcaf5b9b2a12e1 | mayker-dev:planner | deliver | 3,5 | 9 | 17 | 2.12 | 1/0/7 | 2.00/n/a/2.14 | 1.6K | 182.9K | 226.7K | 0.876 | claude-fable-5-1 |  |
| agent-a51e290fec66aa50c | mayker-dev:builder | deliver | 5 | 22 | 29 | 1.38 | 0/0/21 | n/a/n/a/1.38 | 3.1K | 209.9K | 226.3K | 0.958 | claude-opus-5 |  |
| agent-a5254f8758b326a43 | mayker-dev:builder | deliver | 5 | 11 | 17 | 1.7 | 0/0/10 | n/a/n/a/1.70 | 1.1K | 208.7K | 230.5K | 0.913 | claude-opus-5 |  |
| agent-a63cccf49cc7b99e4 | mayker-dev:builder | deliver | 5 | 22 | 26 | 1.24 | 2/3/14 | 2.50/1.00/1.14 | 4.0K | 211.0K | 223.8K | 0.959 | claude-opus-5 |  |
| agent-a6ef6f8b2796d913d | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 1/0/4 | 4.00/n/a/1.75 | 13 | 188.9K | 213.0K | 0.84 | claude-opus-5 |  |
| agent-aa218cb49aeacf87a | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 1/0/3 | 4.00/n/a/1.33 | 11 | 180.5K | 204.1K | 0.809 | claude-opus-5 |  |
| agent-ab412cf12f07952a6 | mayker-dev:orchestrator | deliver | 5 | 3 | 10 | 5.0 | 0/0/2 | n/a/n/a/5.00 | 18 | 137.8K | 157.3K | 0.673 | claude-fable-5-1 |  |
| agent-ab545ad0c79138015 | mayker-dev:orchestrator | deliver | 3 | 5 | 7 | 1.75 | 1/0/3 | 3.00/n/a/1.33 | 2.0K | 129.0K | 139.1K | 0.784 | claude-fable-5-1 |  |
| agent-ab78eb759c857a25b | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/0/5 | 8.00/n/a/1.60 | 1.5K | 212.0K | 237.9K | 0.861 | claude-opus-5 |  |
| agent-ad7063a3fd7d9812b | mayker-dev:reviewer | deliver | 5 | 5 | 23 | 5.75 | 4/0/0 | 5.75/n/a/n/a | 22 | 168.6K | 208.1K | 0.764 | claude-opus-5 |  |
| agent-adaabc710fd1130c5 | mayker-dev:builder | deliver | 5 | 13 | 22 | 1.83 | 0/0/12 | n/a/n/a/1.83 | 1.8K | 212.1K | 227.9K | 0.929 | claude-opus-5 |  |
| agent-adbd3e859ece986c4 | mayker-dev:builder | deliver | 5 | 9 | 17 | 2.12 | 0/1/7 | n/a/2.00/2.14 | 1.6K | 190.0K | 206.7K | 0.898 | claude-opus-5 |  |
| agent-ae162c9c1cef950a7 | mayker-dev:builder | deliver | 5 | 13 | 30 | 2.5 | 1/4/7 | 5.00/2.25/2.29 | 1.9K | 210.7K | 227.1K | 0.929 | claude-opus-5 |  |
| agent-ae72aa90377ae5f8f | mayker-dev:planner | deliver | 3,5 | 11 | 17 | 1.7 | 2/0/8 | 1.00/n/a/1.88 | 2.1K | 179.6K | 218.7K | 0.904 | claude-fable-5-1 |  |
| agent-aee0a4fa2e53f8ff0 | mayker-dev:builder | deliver | 5 | 4 | 10 | 3.33 | 0/0/3 | n/a/n/a/3.33 | 9 | 191.1K | 222.5K | 0.75 | claude-opus-5 |  |
| agent-af4579f1f6266559f | mayker-dev:builder | deliver | 5 | 11 | 26 | 2.6 | 1/2/7 | 6.00/4.00/1.71 | 33 | 207.8K | 224.8K | 0.902 | claude-opus-5 |  |
| agent-af58583a41ecb0026 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/0/5 | 4.50/n/a/1.60 | 1.4K | 184.6K | 200.5K | 0.886 | claude-opus-5 |  |
| agent-af9a40172e67f5570 | mayker-dev:orchestrator | deliver | 5 | 4 | 11 | 3.67 | 1/0/2 | 6.00/n/a/2.50 | 2.3K | 143.2K | 161.4K | 0.765 | claude-fable-5-1 |  |

**23 dispatch(es)** (mayker-dev:builder 14, mayker-dev:orchestrator 4, mayker-dev:planner 2, mayker-dev:reviewer 3): median ctx max 211.0K, peak 237.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 139.1K, 155.5K, 157.3K, 161.4K, 200.5K, 201.3K, 201.6K, 204.1K, 206.7K, 208.1K, 208.9K, 211.0K, 213.0K, 218.7K, 222.5K, 223.8K, 224.8K, 226.3K, 226.7K, 227.1K, 227.9K, 230.5K, 237.9K.

**All runs:** 1 run(s), wall 2h06m (sum of per-run walls, idle time between runs excluded), 332 turns, 543 tool calls, 164.2K output tokens, cache hit 0.946.

Turn classes across every bucket, read / edit / exec: 29/15/233 turns, 4.59/1.87/1.53 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

7 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 0/0/6).
