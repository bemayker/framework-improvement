# Run statistics, run

Generated 2026-11-04 02:39 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 step window(s) closed under 5s after opening, so their boundaries were written together after the step's work, and that work's time sits in the window before each: deliver step 0 (4s). The wall stands; the per-step split around these steps is NOT a measurement. The marker WRITER is the defect: one boundary per call, written when the step begins.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m04s | 1 | 1 | 1.0 | 1 | 234 | 56.8K | 56.8K | 0 | 0.984 | claude-opus-5-5 | 0/0/1 | n/a/n/a/1.00 |  |
| 1 | MCP verification (hard in autonomous mode) | 0m16s | 6 | 10 | 1.67 | 3 | 1.8K | 64.4K | 73.4K | 0 | 0.957 | claude-opus-5-5 | 0/0/5 | n/a/n/a/1.80 |  |
| 3 | Ingest the backlog | 2m52s | 11 | 23 | 2.3 | 5 | 15.4K | 76.8K | 97.8K | 0 | 0.862 | claude-fable-5-1 | 1/3/5 | 4.00/2.00/2.40 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 2m52s | 11 | 23 | 2.3 | 5 | 15.4K | 76.8K | 97.8K | 0 | 0.862 | claude-fable-5-1 | 1/3/5 | 4.00/2.00/2.40 |  |
| 5 | The scheduler loop | 44m08s | 511 | 1024 | 2.29 | 15 | 397.7K | 142.7K | 465.2K | 0 | 0.96 | claude-opus-5-5 | 86/67/267 | 4.10/2.55/1.64 |  |
| 3.orchestrator #2 (in 5) | Final re-ingest (Section W step 2) | 2m12s | 12 | 23 | 2.09 | 4 | 11.9K | 203.5K | 461.2K | 0 | 0.958 | claude-fable-5-1 | 1/3/6 | 4.00/2.33/1.83 |  |
| 8 | Final report | 3m54s | 11 | 13 | 1.44 | 3 | 26.8K | 286.9K | 485.9K | 0 | 0.975 | claude-opus-5-5 | 3/1/4 | 2.00/2.00/1.00 |  |
| **run total** |  | 51m14s | 540 | 1071 | 2.26 | 15 | 441.9K |  | 485.9K |  | 0.959 | claude-opus-5-5 | 90/71/282 (exec 81% of wall) | 4.03/2.52/1.65 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m14s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 41m31s of round trip (command plus model time, ADR 0006 section 2): 81% of wall.

CI wait: 9m25s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m48s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a095a807a5ac808d3 | mayker-dev:reviewer | deliver | 5 | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 5.6K | 49.6K | 62.7K | 0.684 | claude-opus-5-5 |  |
| agent-a0a12d06bb02e6bef | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 855 | 43.0K | 49.8K | 0.717 | claude-sonnet-5-5 |  |
| agent-a0d1308db583e9383 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 2/1/2 | 4.00/2.00/3.50 | 4.8K | 49.8K | 54.7K | 0.816 | claude-fable-5-1 |  |
| agent-a123f2f4e8d930e38 | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 1/1/5 | 3.00/5.00/1.80 | 5.5K | 56.8K | 63.4K | 0.89 | claude-sonnet-5-5 |  |
| agent-a1f98ec1613593dc6 | mayker-dev:orchestrator | deliver | 5 | 5 | 8 | 2.0 | 1/1/2 | 5.00/1.00/1.00 | 3.5K | 45.0K | 48.3K | 0.842 | claude-fable-5-1 |  |
| agent-a23c1c3b1575e245e | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 4.50/1.00/1.33 | 5.4K | 57.0K | 62.4K | 0.876 | claude-fable-5-1 |  |
| agent-a2a50adf11d05249c | mayker-dev:builder | deliver | 5 | 8 | 33 | 4.71 | 2/1/4 | 7.50/13.00/1.25 | 8.8K | 65.6K | 75.9K | 0.855 | claude-sonnet-5-5 |  |
| agent-a2fa207ad525e844e | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.00/3.00/1.25 | 4.6K | 54.9K | 62.0K | 0.889 | claude-sonnet-5-5 |  |
| agent-a35ff77e604cb5f1b | mayker-dev:orchestrator | deliver | 5 | 7 | 18 | 3.0 | 2/1/3 | 4.50/1.00/2.67 | 6.0K | 57.5K | 63.2K | 0.874 | claude-fable-5-1 |  |
| agent-a37920e5b185ef1c6 | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 2.50/1.50/1.50 | 5.9K | 55.2K | 62.2K | 0.901 | claude-sonnet-5-5 |  |
| agent-a37dc494b4cecf198 | mayker-dev:builder | deliver | 5 | 11 | 26 | 2.6 | 2/1/7 | 2.50/5.00/2.29 | 6.0K | 64.8K | 73.4K | 0.916 | claude-sonnet-5-5 |  |
| agent-a4589569a95cb6508 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.00/2.00/1.25 | 5.3K | 53.3K | 60.3K | 0.89 | claude-sonnet-5-5 |  |
| agent-a4a93648cf86a7da8 | mayker-dev:planner | deliver | 5 | 11 | 31 | 3.1 | 1/2/7 | 6.00/1.50/3.14 | 13.2K | 79.1K | 95.0K | 0.891 | claude-opus-5-5 |  |
| agent-a4b47f6a3a9f93054 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 760 | 42.5K | 55.2K | 0.672 | claude-sonnet-5-5 |  |
| agent-a4f0082b74af670e9 | mayker-dev:orchestrator | deliver | 3 | 8 | 19 | 2.71 | 1/2/4 | 4.00/2.00/2.75 | 12.9K | 75.2K | 97.8K | 0.837 | claude-fable-5-1 |  |
| agent-a548555ca792ced55 | mayker-dev:planner | deliver | 5 | 12 | 34 | 3.09 | 1/1/7 | 3.00/2.00/2.43 | 15.8K | 80.8K | 101.4K | 0.895 | claude-opus-5-5 |  |
| agent-a5553cb5c3e6d499b | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 4.00/5.00/1.00 | 7.3K | 62.7K | 71.0K | 0.868 | claude-sonnet-5-5 |  |
| agent-a65cb15dcafad150e | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 3/1/2 | 3.33/1.00/1.00 | 4.6K | 53.7K | 62.0K | 0.835 | claude-fable-5-1 |  |
| agent-a695f552627ca0254 | mayker-dev:planner | deliver | 5 | 13 | 33 | 2.75 | 1/1/9 | 5.00/2.00/2.00 | 20.2K | 94.9K | 120.7K | 0.913 | claude-opus-5-5 |  |
| agent-a75f1262cd7526ed7 | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 1/2/2 | 4.00/2.00/1.00 | 2.7K | 44.6K | 47.6K | 0.872 | claude-sonnet-5-5 |  |
| agent-a81bf62c221f2f2a4 | mayker-dev:orchestrator | deliver | 5 | 8 | 19 | 2.71 | 1/2/4 | 4.00/3.00/2.25 | 10.0K | 75.6K | 96.8K | 0.84 | claude-fable-5-1 |  |
| agent-a830c2845101c9abc | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 3/1/2 | 3.00/1.00/1.00 | 3.4K | 50.9K | 57.9K | 0.837 | claude-fable-5-1 |  |
| agent-a864e65cdd660124f | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 9.00/1.00/1.00 | 6.5K | 61.6K | 68.6K | 0.849 | claude-fable-5-1 |  |
| agent-a86b6bc63e2277e84 | mayker-dev:builder | deliver | 5 | 15 | 26 | 1.86 | 1/1/11 | 3.00/2.00/1.82 | 6.0K | 66.2K | 75.0K | 0.938 | claude-sonnet-5-5 |  |
| agent-a88c48cb7cab25bf6 | mayker-dev:reviewer | deliver | 5 | 5 | 26 | 6.5 | 4/0/0 | 6.50/n/a/n/a | 8.6K | 59.0K | 74.0K | 0.78 | claude-opus-5-5 |  |
| agent-a9a83b274c6205c02 | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 8.00/2.00/2.33 | 6.3K | 58.1K | 64.9K | 0.85 | claude-fable-5-1 |  |
| agent-a9cf3b33053922a5b | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/2/2 | 5.00/5.50/1.00 | 7.6K | 62.7K | 73.2K | 0.863 | claude-sonnet-5-5 |  |
| agent-aa7c5fc011d634401 | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 3/1/3 | 4.33/1.00/1.00 | 4.8K | 53.3K | 62.6K | 0.853 | claude-fable-5-1 |  |
| agent-aa89f9481bd359636 | mayker-dev:builder | deliver | 5 | 12 | 28 | 2.55 | 1/4/6 | 5.00/3.75/1.33 | 7.2K | 57.1K | 63.1K | 0.927 | claude-sonnet-5-5 |  |
| agent-aaa3d60602a5c7fae | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 2/2/1 | 5.00/2.00/1.00 | 3.4K | 52.2K | 57.8K | 0.858 | claude-sonnet-5-5 |  |
| agent-aaac9407a8ba0dd54 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/2/3 | 2.50/3.00/1.00 | 7.6K | 56.8K | 64.6K | 0.887 | claude-sonnet-5-5 |  |
| agent-aad903eaff8133e13 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 999 | 38.1K | 40.8K | 0.76 | claude-sonnet-5-5 |  |
| agent-ab34d4927abe73b5c | mayker-dev:planner | deliver | 5 | 14 | 33 | 2.54 | 2/2/9 | 5.50/1.50/2.11 | 13.7K | 81.2K | 99.1K | 0.924 | claude-opus-5-5 |  |
| agent-ab4c8fb7f58dd7d9f | mayker-dev:builder | deliver | 5 | 8 | 19 | 2.71 | 2/2/3 | 3.00/4.00/1.67 | 6.3K | 48.7K | 54.5K | 0.894 | claude-sonnet-5-5 |  |
| agent-ac50ee7791cb29c48 | mayker-dev:builder | deliver | 5 | 7 | 18 | 3.0 | 1/2/3 | 5.00/5.00/1.00 | 5.1K | 59.9K | 68.6K | 0.836 | claude-sonnet-5-5 |  |
| agent-ac781dd9cb002824a | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 2/1/3 | 3.50/10.00/2.00 | 6.8K | 60.3K | 71.1K | 0.863 | claude-sonnet-5-5 |  |
| agent-ac914a950787c5e37 | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 2/0/1 | 1.50/n/a/1.00 | 817 | 46.4K | 58.8K | 0.755 | claude-sonnet-5-5 |  |
| agent-ad28fc30b25bbfb24 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/2/2 | 4.00/1.50/1.00 | 3.6K | 48.6K | 53.6K | 0.882 | claude-sonnet-5-5 |  |
| agent-ada3017ee681252be | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 4.7K | 48.8K | 61.4K | 0.733 | claude-opus-5-5 |  |
| agent-adb8e3992cc2b8afd | mayker-dev:builder | deliver | 5 | 4 | 7 | 2.33 | 2/0/1 | 2.50/n/a/2.00 | 1.4K | 51.6K | 63.9K | 0.755 | claude-sonnet-5-5 |  |
| agent-ae3112e2817dfdcaf | mayker-dev:orchestrator | deliver | 5 | 8 | 12 | 2.0 | 3/1/2 | 3.00/1.00/1.00 | 5.0K | 51.5K | 57.9K | 0.89 | claude-fable-5-1 |  |
| agent-aec78c7acf0ce7532 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 5.6K | 47.4K | 65.7K | 0.538 | claude-opus-5-5 |  |
| agent-aecda5d795040719c | mayker-dev:builder | deliver | 5 | 13 | 17 | 1.42 | 2/1/9 | 2.00/2.00/1.22 | 7.6K | 57.0K | 63.8K | 0.932 | claude-sonnet-5-5 |  |
| agent-af2e3dee595ac628f | mayker-dev:planner | deliver | 5 | 16 | 40 | 2.67 | 2/3/9 | 3.50/1.33/2.33 | 23.2K | 88.9K | 109.8K | 0.932 | claude-opus-5-5 |  |
| agent-af85e82db6aac92db | mayker-dev:orchestrator | deliver | 8 | 5 | 6 | 2.0 | 3/0/0 | 2.00/n/a/n/a | 15.6K | 60.4K | 71.5K | 0.81 | claude-fable-5-1 |  |
| agent-afcedd60b799b3cca | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 4.9K | 53.8K | 69.0K | 0.679 | claude-opus-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 63.6K, peak 120.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 40.8K, 47.6K, 48.3K, 49.8K, 53.6K, 54.5K, 54.7K, 55.2K, 57.8K, 57.9K, 57.9K, 58.8K, 60.3K, 61.4K, 62.0K, 62.0K, 62.2K, 62.4K, 62.6K, 62.7K, 63.1K, 63.2K, 63.4K, 63.8K, 63.9K, 64.6K, 64.9K, 65.7K, 68.6K, 68.6K, 69.0K, 71.0K, 71.1K, 71.5K, 73.2K, 73.4K, 74.0K, 75.0K, 75.9K, 95.0K, 96.8K, 97.8K, 99.1K, 101.4K, 109.8K, 120.7K.

**All runs:** 1 run(s), wall 51m14s (sum of per-run walls, idle time between runs excluded), 540 turns, 1071 tool calls, 441.9K output tokens, cache hit 0.959.

Turn classes across every bucket, read / edit / exec: 90/71/282 turns, 4.03/2.52/1.65 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 41m31s of round trip (command plus model time, ADR 0006 section 2): 81% of wall.

All runs: CI wait: 9m25s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m48s.

4 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/2).
