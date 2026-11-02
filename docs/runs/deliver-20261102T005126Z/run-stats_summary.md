# Run statistics, run

Generated 2026-11-02 01:12 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 10 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 3m14s | 14 | 28 | 2.15 | 5 | 16.7K | 74.0K | 93.0K | 0 | 0.896 | claude-fable-5-1 | 1/5/6 | 4.00/2.60/1.67 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 3m14s | 14 | 28 | 2.15 | 5 | 16.7K | 74.0K | 93.0K | 0 | 0.896 | claude-fable-5-1 | 1/5/6 | 4.00/2.60/1.67 |  |
| 5 | Scheduler loop | 15m00s | 114 | 193 | 1.84 | 8 | 67.0K | 109.7K | 205.2K | 0 | 0.951 | claude-opus-5-5 | 16/18/60 | 3.69/1.78/1.50 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at wave boundary | 2m01s | 12 | 21 | 2.1 | 4 | 10.8K | 91.4K | 200.9K | 0 | 0.936 | claude-fable-5-1 | 1/3/4 | 4.00/2.00/2.00 |  |
| 8 | Final report | 2m32s | 8 | 11 | 1.57 | 5 | 15.1K | 95.8K | 213.2K | 0 | 0.922 | claude-fable-5-1 | 3/1/2 | 2.33/1.00/1.00 |  |
| **run total** |  | 20m46s | 136 | 232 | 1.86 | 8 | 98.8K |  | 213.2K |  | 0.945 | claude-opus-5-5 | 20/24/68 (exec 42% of wall) | 3.50/1.92/1.50 |  |

Wall is this run's last step end minus its first step start; steps sum to 20m46s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 8m37s of round trip (command plus model time, ADR 0006 section 2): 42% of wall.

CI wait: 1m32s in `ci-poll.sh` calls; framework wall (wall less CI wait) 19m14s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0135170b1464cc0d | mayker-dev:orchestrator | deliver | 5 | 6 | 18 | 3.6 | 1/2/2 | 6.00/1.50/4.50 | 5.7K | 65.6K | 74.7K | 0.848 | claude-fable-5-1 |  |
| agent-a17751e144f1cb44d | mayker-dev:orchestrator | deliver | 5 | 10 | 18 | 2.25 | 1/2/4 | 4.00/2.00/2.00 | 9.1K | 69.7K | 82.5K | 0.903 | claude-fable-5-1 |  |
| agent-a659b5a79bb216e3b | mayker-dev:orchestrator | deliver | 3 | 10 | 22 | 2.44 | 1/4/4 | 4.00/2.75/1.75 | 14.5K | 71.2K | 86.4K | 0.878 | claude-fable-5-1 |  |
| agent-a84b2ad82a92cee7d | mayker-dev:builder | deliver | 5 | 2 | 3 | 3.0 | 0/0/1 | n/a/n/a/3.00 | 559 | 42.4K | 47.9K | 0.618 | claude-sonnet-5-5 |  |
| agent-a84bd74a63e620681 | mayker-dev:builder | deliver | 5 | 8 | 18 | 2.57 | 1/2/4 | 4.00/2.50/2.25 | 5.0K | 69.2K | 78.2K | 0.859 | claude-sonnet-5-5 |  |
| agent-a962033d310f089b4 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.00/1.00/2.33 | 3.9K | 66.5K | 76.0K | 0.836 | claude-fable-5-1 |  |
| agent-a9fb2888e75a0d6cc | mayker-dev:reviewer | deliver | 5 | 4 | 16 | 5.33 | 3/0/0 | 5.33/n/a/n/a | 4.9K | 50.7K | 63.8K | 0.685 | claude-opus-5-5 |  |
| agent-ab3b93f38c00246ba | mayker-dev:orchestrator | deliver | 8 | 6 | 9 | 1.8 | 3/0/2 | 2.33/n/a/1.00 | 9.2K | 57.8K | 66.9K | 0.85 | claude-fable-5-1 |  |
| agent-ae6ce2cc2f4f94ff5 | mayker-dev:builder | deliver | 5 | 8 | 18 | 2.57 | 2/2/3 | 5.00/2.50/1.00 | 4.7K | 65.3K | 71.8K | 0.892 | claude-sonnet-5-5 |  |
| agent-af00d4db29a21517d | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/1/4 | 3.50/2.00/2.00 | 5.1K | 73.7K | 84.4K | 0.883 | claude-sonnet-5-5 |  |

**10 dispatch(es)** in `deliver` (mayker-dev:builder 4, mayker-dev:orchestrator 5, mayker-dev:reviewer 1): median ctx max 75.3K, peak 86.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 47.9K, 63.8K, 66.9K, 71.8K, 74.7K, 76.0K, 78.2K, 82.5K, 84.4K, 86.4K.

**All runs:** 1 run(s), wall 20m46s (sum of per-run walls, idle time between runs excluded), 136 turns, 232 tool calls, 98.8K output tokens, cache hit 0.945.

Turn classes across every bucket, read / edit / exec: 20/24/68 turns, 3.50/1.92/1.50 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 8m37s of round trip (command plus model time, ADR 0006 section 2): 42% of wall.

All runs: CI wait: 1m32s in `ci-poll.sh` calls; framework wall (wall less CI wait) 19m14s.

10 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/7).
