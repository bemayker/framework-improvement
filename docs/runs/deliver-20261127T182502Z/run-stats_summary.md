# Run statistics, run

Generated 2026-11-27 19:04 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 42 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

No context window is known for `claude-fable-5-2`, so no step or dispatch served by it is flagged on context size. That is fail-open by design: a guessed window would read as a measurement while being wrong. Add the row to hooks/lib/model-windows.tsv once you have checked it.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 39m51s | 476 | 969 | 2.32 | 14 | 365.9K |  | 513.6K |  | 0.96 | claude-opus-5-5 | 72/71/240 (exec 80% of wall) | 4.22/2.03/1.90 |  |

Wall is this run's last step end minus its first step start; steps sum to 39m51s.

Exec turns took 32m01s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

CI wait: 6m15s in `ci-poll.sh` calls; framework wall (wall less CI wait) 33m35s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0288cfdad49c9403 | mayker-dev:orchestrator | deliver | 8 | 4 | 10 | 3.33 | 1/0/2 | 1.00/n/a/4.50 | 8.1K | 55.7K | 67.0K | 0.764 | claude-fable-5-2 |  |
| agent-a031d0279de7d6b63 | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.78 | 1/2/6 | 3.00/1.50/1.67 | 7.8K | 62.4K | 70.8K | 0.916 | claude-sonnet-5-5 |  |
| agent-a040d5289a47b6107 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 4.5K | 47.9K | 53.2K | 0.831 | claude-fable-5-2 |  |
| agent-a0af87ad59816bd15 | mayker-dev:builder | deliver | 5 | 11 | 19 | 1.9 | 2/1/6 | 3.50/3.00/1.33 | 4.6K | 59.7K | 65.1K | 0.921 | claude-sonnet-5-5 |  |
| agent-a0b1aaf71cfc78156 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 742 | 39.7K | 47.1K | 0.716 | claude-sonnet-5-5 |  |
| agent-a1923bdbfb530865f | mayker-dev:builder | deliver | 5 | 11 | 15 | 1.5 | 3/3/4 | 2.00/1.33/1.25 | 7.3K | 57.3K | 64.8K | 0.918 | claude-sonnet-5-5 |  |
| agent-a1c86e36a6bfe58ac | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.0K | 48.5K | 52.6K | 0.783 | claude-fable-5-2 |  |
| agent-a1e4e25c3301f39f0 | mayker-dev:orchestrator | deliver | 5 | 9 | 18 | 2.25 | 0/3/4 | n/a/1.67/1.50 | 8.0K | 77.4K | 89.8K | 0.889 | claude-fable-5-2 |  |
| agent-a22533501d47f18d5 | mayker-dev:builder | deliver | 5 | 7 | 8 | 1.33 | 2/2/2 | 2.00/1.00/1.00 | 3.9K | 47.1K | 51.6K | 0.883 | claude-sonnet-5-5 |  |
| agent-a2a8060a72b4e8a64 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 1/2/1 | 6.00/3.50/1.00 | 4.6K | 57.3K | 65.6K | 0.817 | claude-sonnet-5-5 |  |
| agent-a2d95a5da583884ef | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 1/1/5 | 1.00/2.00/3.40 | 6.7K | 56.9K | 64.9K | 0.885 | claude-fable-5-2 |  |
| agent-a307d4d5456c462c9 | mayker-dev:orchestrator | deliver | 5 | 9 | 16 | 2.0 | 0/3/4 | n/a/1.00/2.00 | 6.2K | 75.3K | 87.7K | 0.892 | claude-fable-5-2 |  |
| agent-a33cf9847ef923263 | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 6.50/1.00/1.00 | 3.7K | 60.9K | 68.3K | 0.871 | claude-sonnet-5-5 |  |
| agent-a43495d3c259d0344 | mayker-dev:builder | deliver | 5 | 5 | 6 | 1.5 | 1/1/2 | 1.00/1.00/2.00 | 1.8K | 45.0K | 49.2K | 0.84 | claude-sonnet-5-5 |  |
| agent-a447365b72d36dd76 | mayker-dev:reviewer | deliver | 5 | 2 | 6 | 6.0 | 1/0/0 | 6.00/n/a/n/a | 1.9K | 34.1K | 44.1K | 0.491 | claude-opus-5-5 |  |
| agent-a476eadb19e4b36ff | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 1/0/0 | 2.00/n/a/n/a | 468 | 38.4K | 44.1K | 0.599 | claude-sonnet-5-5 |  |
| agent-a48c46d0ef7fe53d6 | mayker-dev:builder | deliver | 5 | 6 | 20 | 4.0 | 2/1/2 | 4.50/8.00/1.50 | 6.1K | 59.8K | 69.0K | 0.845 | claude-sonnet-5-5 |  |
| agent-a52ada90831e8482e | mayker-dev:planner | deliver | 5 | 11 | 35 | 3.5 | 1/2/6 | 5.00/1.50/3.83 | 13.1K | 90.1K | 120.1K | 0.892 | claude-opus-5-5 |  |
| agent-a5bc9275599af770e | mayker-dev:builder | deliver | 5 | 9 | 28 | 3.5 | 2/2/4 | 5.00/5.00/2.00 | 8.2K | 69.6K | 80.4K | 0.872 | claude-sonnet-5-5 |  |
| agent-a60a18136f8cc1f1c | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 4.7K | 45.4K | 62.3K | 0.542 | claude-opus-5-5 |  |
| agent-a62bfbc8c094c8f33 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.50/2.00/1.50 | 5.4K | 55.7K | 63.6K | 0.887 | claude-sonnet-5-5 |  |
| agent-a66989ec440a91d02 | mayker-dev:planner | deliver | 5 | 12 | 37 | 3.36 | 1/2/7 | 3.00/1.50/3.29 | 15.9K | 84.1K | 107.8K | 0.893 | claude-opus-5-5 |  |
| agent-a6c1429fcc5d1c0b7 | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/2/2 | 3.50/3.00/1.00 | 3.9K | 59.7K | 67.1K | 0.871 | claude-sonnet-5-5 |  |
| agent-a6f7f82f3765720b0 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 2/1/1 | 5.50/2.00/1.00 | 2.9K | 52.2K | 59.5K | 0.823 | claude-sonnet-5-5 |  |
| agent-a736883b5ffac5f36 | mayker-dev:builder | deliver | 5 | 17 | 31 | 1.94 | 2/1/12 | 3.50/3.00/1.67 | 8.2K | 66.5K | 73.9K | 0.946 | claude-sonnet-5-5 |  |
| agent-a79015a1f38c080cf | mayker-dev:builder | deliver | 5 | 5 | 13 | 3.25 | 2/1/1 | 5.00/2.00/1.00 | 3.1K | 56.4K | 65.1K | 0.816 | claude-sonnet-5-5 |  |
| agent-a813a22fb269d8c6b | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 0/1/3 | n/a/1.00/4.33 | 4.2K | 54.8K | 61.0K | 0.824 | claude-fable-5-2 |  |
| agent-a84f575e55f20ff63 | mayker-dev:planner | deliver | 5 | 10 | 33 | 3.67 | 1/1/6 | 6.00/2.00/3.17 | 17.4K | 83.8K | 116.1K | 0.861 | claude-opus-5-5 |  |
| agent-a8a561c929e9a7dd3 | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 2/1/4 | 5.00/2.00/2.00 | 5.4K | 54.1K | 60.0K | 0.891 | claude-fable-5-2 |  |
| agent-a8e08f6ae3992bccf | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 5.3K | 45.6K | 63.5K | 0.536 | claude-opus-5-5 |  |
| agent-a97d227beb1289a03 | mayker-dev:reviewer | deliver | 5 | 4 | 23 | 7.67 | 3/0/0 | 7.67/n/a/n/a | 6.6K | 51.6K | 68.3K | 0.714 | claude-opus-5-5 |  |
| agent-aa1b1a3657d70c502 | mayker-dev:reviewer | deliver | 5 | 4 | 16 | 5.33 | 3/0/0 | 5.33/n/a/n/a | 6.2K | 49.6K | 64.7K | 0.674 | claude-opus-5-5 |  |
| agent-aa37a1a5df0566768 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 883 | 39.9K | 47.5K | 0.713 | claude-sonnet-5-5 |  |
| agent-aa95bdcd222174cdd | mayker-dev:builder | deliver | 5 | 9 | 37 | 4.62 | 2/3/3 | 8.00/5.67/1.33 | 10.6K | 68.7K | 79.3K | 0.893 | claude-sonnet-5-5 |  |
| agent-acace5469fb871c5e | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 2/2/4 | 2.50/1.50/1.50 | 6.7K | 58.9K | 66.9K | 0.899 | claude-sonnet-5-5 |  |
| agent-ad42443f0e6a6aec5 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 3.0 | 1/1/1 | 6.00/2.00/1.00 | 4.2K | 48.3K | 53.5K | 0.831 | claude-fable-5-2 |  |
| agent-ad4aa5f1caf39d681 | mayker-dev:orchestrator | deliver | 5 | 5 | 12 | 3.0 | 1/1/2 | 6.00/2.00/2.00 | 3.9K | 49.7K | 55.8K | 0.827 | claude-fable-5-2 |  |
| agent-adc68df46d9a8ef24 | mayker-dev:orchestrator | deliver | 5 | 5 | 13 | 3.25 | 1/1/2 | 7.00/2.00/2.00 | 4.2K | 49.8K | 56.1K | 0.775 | claude-fable-5-2 |  |
| agent-ae1decad613a61a54 | mayker-dev:orchestrator | deliver | 3 | 14 | 41 | 3.15 | 1/3/9 | 4.00/2.00/3.44 | 16.6K | 109.7K | 132.8K | 0.914 | claude-fable-5-2 |  |
| agent-aec69d182e0e430e7 | mayker-dev:planner | deliver | 5 | 11 | 28 | 2.8 | 1/2/7 | 7.00/1.50/2.57 | 13.3K | 76.1K | 94.9K | 0.887 | claude-opus-5-5 |  |
| agent-af3ef1902a35fd0fd | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.4 | 1/2/2 | 5.00/1.50/2.00 | 5.5K | 50.4K | 56.8K | 0.875 | claude-fable-5-2 |  |
| agent-afb55674834f1bea6 | mayker-dev:orchestrator | deliver | 5 | 8 | 16 | 2.29 | 3/1/3 | 3.33/1.00/1.67 | 4.0K | 48.7K | 54.1K | 0.894 | claude-fable-5-2 |  |

**42 dispatch(es)** in `deliver` (mayker-dev:builder 19, mayker-dev:orchestrator 14, mayker-dev:planner 4, mayker-dev:reviewer 5): median ctx max 64.8K, peak 132.8K, 0 above the auto threshold (80% of the serving model's window). Distribution: 44.1K, 44.1K, 47.1K, 47.5K, 49.2K, 51.6K, 52.6K, 53.2K, 53.5K, 54.1K, 55.8K, 56.1K, 56.8K, 59.5K, 60.0K, 61.0K, 62.3K, 63.5K, 63.6K, 64.7K, 64.8K, 64.9K, 65.1K, 65.1K, 65.6K, 66.9K, 67.0K, 67.1K, 68.3K, 68.3K, 69.0K, 70.8K, 73.9K, 79.3K, 80.4K, 87.7K, 89.8K, 94.9K, 107.8K, 116.1K, 120.1K, 132.8K.

**All runs:** 1 run(s), wall 39m51s (sum of per-run walls, idle time between runs excluded), 476 turns, 969 tool calls, 365.9K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 72/71/240 turns, 4.22/2.03/1.90 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 32m01s of round trip (command plus model time, ADR 0006 section 2): 80% of wall.

All runs: CI wait: 6m15s in `ci-poll.sh` calls; framework wall (wall less CI wait) 33m35s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
