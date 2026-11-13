# Run statistics, run

Generated 2026-11-13 17:18 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 42m02s | 528 | 1049 | 2.28 | 13 | 406.2K |  | 496.8K |  | 0.961 | claude-opus-5-5 | 70/81/271 (exec 79% of wall) | 4.17/2.21/1.87 |  |

Wall is this run's last step end minus its first step start; steps sum to 42m02s.

Exec turns took 33m01s of round trip (command plus model time, ADR 0006 section 2): 79% of wall.

CI wait: 7m18s in `ci-poll.sh` calls; framework wall (wall less CI wait) 34m43s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a03dd79e32ae858b2 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 1/2/3 | 7.00/1.00/1.33 | 3.0K | 52.4K | 56.7K | 0.881 | claude-sonnet-5-5 |  |
| agent-a0726adcb4ceb6d04 | mayker-dev:builder | deliver | 5 | 6 | 18 | 3.6 | 2/1/2 | 4.00/8.00/1.00 | 5.0K | 56.5K | 63.9K | 0.812 | claude-sonnet-5-5 |  |
| agent-a08e27e18b5b67682 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 1/0/2 | 2.00/n/a/1.50 | 1.1K | 39.5K | 45.6K | 0.795 | claude-sonnet-5-5 |  |
| agent-a0b9151de22528cc0 | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 5.1K | 47.8K | 59.2K | 0.691 | claude-opus-5-5 |  |
| agent-a0c062a84272f2790 | mayker-dev:orchestrator | deliver | 3 | 11 | 28 | 2.8 | 1/3/5 | 4.00/1.67/2.60 | 10.7K | 98.5K | 118.1K | 0.891 | claude-fable-5-2 |  |
| agent-a102d236ddd3fb243 | mayker-dev:planner | deliver | 5 | 12 | 29 | 2.64 | 1/1/9 | 7.00/2.00/2.22 | 14.3K | 73.5K | 90.9K | 0.912 | claude-opus-5-5 |  |
| agent-a1871c3d6593e984e | mayker-dev:planner | deliver | 5 | 14 | 38 | 2.92 | 2/2/8 | 3.00/1.00/2.62 | 21.1K | 84.4K | 105.8K | 0.921 | claude-opus-5-5 |  |
| agent-a1a957f5dcf2f1ada | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 5.00/3.00/1.33 | 3.4K | 48.4K | 54.1K | 0.857 | claude-fable-5-2 |  |
| agent-a29759c47209c781f | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 6.0K | 52.1K | 67.2K | 0.722 | claude-opus-5-5 |  |
| agent-a2a2fe865909782d1 | mayker-dev:builder | deliver | 5 | 17 | 32 | 2.0 | 4/1/10 | 2.25/3.00/1.90 | 7.9K | 68.0K | 77.5K | 0.944 | claude-sonnet-5-5 |  |
| agent-a2d8c19ab315ef39e | mayker-dev:builder | deliver | 5 | 12 | 19 | 1.73 | 1/1/8 | 4.00/3.00/1.38 | 5.6K | 65.4K | 72.2K | 0.925 | claude-sonnet-5-5 |  |
| agent-a3473a473455de891 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 7.00/3.00/1.00 | 4.2K | 58.0K | 63.7K | 0.876 | claude-sonnet-5-5 |  |
| agent-a36935615b09fcdf2 | mayker-dev:planner | deliver | 5 | 11 | 32 | 3.2 | 1/2/7 | 10.00/1.50/2.71 | 15.6K | 82.0K | 103.3K | 0.885 | claude-opus-5-5 |  |
| agent-a3710a80616cc82b3 | mayker-dev:builder | deliver | 5 | 4 | 8 | 2.67 | 1/1/1 | 5.00/2.00/1.00 | 2.2K | 48.2K | 53.5K | 0.79 | claude-sonnet-5-5 |  |
| agent-a3997ae6526be9c57 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 1/2/3 | 4.00/4.50/2.67 | 7.1K | 62.3K | 70.4K | 0.869 | claude-sonnet-5-5 |  |
| agent-a3ccf224c51a18c5a | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 3.00/3.00/1.25 | 6.1K | 57.8K | 64.5K | 0.889 | claude-sonnet-5-5 |  |
| agent-a3ebae7afcbc884cf | mayker-dev:planner | deliver | 5 | 11 | 31 | 3.1 | 2/2/6 | 3.00/1.00/3.83 | 12.5K | 83.0K | 103.9K | 0.9 | claude-opus-5-5 |  |
| agent-a405690aefd22a319 | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.75 | 1/1/2 | 5.00/2.00/2.00 | 3.7K | 48.5K | 54.9K | 0.826 | claude-fable-5-2 |  |
| agent-a50d58fe57571a050 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.0K | 44.9K | 60.2K | 0.554 | claude-opus-5-5 |  |
| agent-a6047fdc48dbc2cb3 | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 6.5K | 48.6K | 66.4K | 0.545 | claude-opus-5-5 |  |
| agent-a612941e223ce4531 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.6 | 1/1/3 | 6.00/2.00/1.67 | 5.2K | 53.8K | 60.9K | 0.872 | claude-fable-5-2 |  |
| agent-a62790e49d240deef | mayker-dev:planner | deliver | 5 | 9 | 18 | 2.25 | 1/2/5 | 1.00/2.00/2.60 | 14.0K | 63.0K | 72.1K | 0.896 | claude-opus-5-5 |  |
| agent-a6b6cdf80b1ee9743 | mayker-dev:orchestrator | deliver | 5 | 5 | 12 | 3.0 | 0/1/3 | n/a/1.00/3.67 | 4.3K | 50.0K | 54.6K | 0.833 | claude-fable-5-2 |  |
| agent-a6bf9fb4ce755ac59 | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 1/1/4 | 4.00/2.00/1.00 | 4.1K | 52.4K | 57.0K | 0.88 | claude-sonnet-5-5 |  |
| agent-a6d6f3efe149a8414 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 2/0/0 | 1.50/n/a/n/a | 764 | 42.2K | 54.5K | 0.673 | claude-sonnet-5-5 |  |
| agent-a6ebe16ee8b72b376 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 4.00/3.00/1.00 | 3.2K | 54.4K | 60.5K | 0.855 | claude-sonnet-5-5 |  |
| agent-a713d8307437a664c | mayker-dev:builder | deliver | 5 | 7 | 24 | 4.0 | 1/1/4 | 4.00/8.00/3.00 | 8.0K | 64.8K | 77.2K | 0.859 | claude-sonnet-5-5 |  |
| agent-a7d554e36a8698bfe | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 2/0/1 | 1.50/n/a/1.00 | 1.1K | 45.7K | 55.4K | 0.769 | claude-sonnet-5-5 |  |
| agent-a82ae123bb11bc182 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 1.00/2.00/3.50 | 4.8K | 49.2K | 54.9K | 0.878 | claude-fable-5-2 |  |
| agent-a83189f0646bbb89a | mayker-dev:builder | deliver | 5 | 6 | 29 | 5.8 | 2/1/2 | 7.00/13.00/1.00 | 8.4K | 63.2K | 74.4K | 0.838 | claude-sonnet-5-5 |  |
| agent-a88d6084f43159bbb | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 1/2/3 | 4.00/3.00/1.67 | 5.3K | 53.5K | 59.8K | 0.875 | claude-sonnet-5-5 |  |
| agent-a965b8755460e9cd6 | mayker-dev:orchestrator | deliver | 8 | 2 | 5 | 5.0 | 1/0/0 | 5.00/n/a/n/a | 7.9K | 48.6K | 58.3K | 0.543 | claude-fable-5-2 |  |
| agent-aa3faa3eccab880f9 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 0/1/4 | n/a/2.00/3.50 | 4.6K | 49.2K | 53.8K | 0.818 | claude-fable-5-2 |  |
| agent-aa574848429bf6246 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 3.50/2.00/1.25 | 4.7K | 54.6K | 62.0K | 0.888 | claude-sonnet-5-5 |  |
| agent-ab554bc6a7bb581db | mayker-dev:orchestrator | deliver | 5 | 6 | 17 | 3.4 | 1/1/3 | 3.00/2.00/4.00 | 5.7K | 58.1K | 68.4K | 0.84 | claude-fable-5-2 |  |
| agent-ab8a416aa1085988f | mayker-dev:orchestrator | deliver | 5 | 9 | 20 | 2.5 | 0/4/3 | n/a/2.00/1.67 | 7.3K | 80.4K | 93.2K | 0.871 | claude-fable-5-2 |  |
| agent-abbef235a74e1b921 | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 1/1/2 | 8.00/2.00/1.50 | 4.3K | 53.1K | 58.5K | 0.828 | claude-fable-5-2 |  |
| agent-abe59ee727295dacd | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 1/2/2 | 7.00/3.50/1.00 | 5.0K | 58.4K | 65.7K | 0.85 | claude-sonnet-5-5 |  |
| agent-ac78974c77eff8d4d | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 0/1/5 | n/a/2.00/3.00 | 5.2K | 52.7K | 58.6K | 0.876 | claude-fable-5-2 |  |
| agent-ac7ee87da0fcb80c7 | mayker-dev:planner | deliver | 5 | 12 | 29 | 2.64 | 0/2/8 | n/a/1.50/2.62 | 13.0K | 77.5K | 96.5K | 0.896 | claude-opus-5-5 |  |
| agent-ac9a83de4580e094e | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 0/1/3 | n/a/2.00/4.00 | 4.0K | 46.7K | 51.4K | 0.78 | claude-fable-5-2 |  |
| agent-ace24b10460940435 | mayker-dev:builder | deliver | 5 | 10 | 16 | 1.78 | 2/2/5 | 3.00/2.00/1.20 | 6.1K | 55.3K | 61.9K | 0.912 | claude-sonnet-5-5 |  |
| agent-ada55530a30a604ad | mayker-dev:reviewer | deliver | 5 | 5 | 20 | 5.0 | 4/0/0 | 5.00/n/a/n/a | 7.5K | 53.6K | 70.2K | 0.773 | claude-opus-5-5 |  |
| agent-ae290439480dca4c3 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.2K | 48.1K | 60.2K | 0.755 | claude-sonnet-5-5 |  |
| agent-ae7cbc7398a21da6d | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 3.00/1.50/1.00 | 6.0K | 54.4K | 60.3K | 0.913 | claude-sonnet-5-5 |  |
| agent-aeea47d24bb9fd785 | mayker-dev:builder | deliver | 5 | 4 | 7 | 2.33 | 2/0/1 | 3.00/n/a/1.00 | 1.2K | 47.9K | 58.4K | 0.764 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 22, mayker-dev:orchestrator 13, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 61.4K, peak 118.1K, 0 above the auto threshold (80% of the serving model's window). Distribution: 45.6K, 51.4K, 53.5K, 53.8K, 54.1K, 54.5K, 54.6K, 54.9K, 54.9K, 55.4K, 56.7K, 57.0K, 58.3K, 58.4K, 58.5K, 58.6K, 59.2K, 59.8K, 60.2K, 60.2K, 60.3K, 60.5K, 60.9K, 61.9K, 62.0K, 63.7K, 63.9K, 64.5K, 65.7K, 66.4K, 67.2K, 68.4K, 70.2K, 70.4K, 72.1K, 72.2K, 74.4K, 77.2K, 77.5K, 90.9K, 93.2K, 96.5K, 103.3K, 103.9K, 105.8K, 118.1K.

**All runs:** 1 run(s), wall 42m02s (sum of per-run walls, idle time between runs excluded), 528 turns, 1049 tool calls, 406.2K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 70/81/271 turns, 4.17/2.21/1.87 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 33m01s of round trip (command plus model time, ADR 0006 section 2): 79% of wall.

All runs: CI wait: 7m18s in `ci-poll.sh` calls; framework wall (wall less CI wait) 34m43s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
