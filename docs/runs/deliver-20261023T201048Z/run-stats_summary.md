# Run statistics, run

Generated 2026-10-23 20:41 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 10 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 2m00s | 11 | 19 | 1.9 | 4 | 9.9K | 70.8K | 86.5K | 0 | 0.876 | claude-fable-5-1 | 1/2/5 | 4.00/2.00/1.80 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 2m00s | 11 | 19 | 1.9 | 4 | 9.9K | 70.8K | 86.5K | 0 | 0.876 | claude-fable-5-1 | 1/2/5 | 4.00/2.00/1.80 |  |
| 8 | Final report | 2m42s | 7 | 9 | 1.5 | 3 | 16.5K | 110.6K | 198.0K | 0 | 0.933 | claude-fable-5-1 | 2/1/2 | 2.00/2.00/1.00 |  |
| **run total** |  | 30m30s | 18 | 28 | 1.75 | 4 | 26.4K |  | 198.0K |  | 0.904 | claude-fable-5-1 | 3/3/7 (exec 3% of wall) | 2.67/2.00/1.57 |  |

Wall is this run's last step end minus its first step start; steps sum to 4m42s.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 0m52s of round trip (command plus model time, ADR 0006 section 2): 3% of wall.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a361b805ba51753b8 | mayker-dev:orchestrator | deliver | 3 | 8 | 15 | 2.14 | 1/1/4 | 4.00/2.00/2.00 | 8.3K | 68.4K | 81.0K | 0.852 | claude-fable-5-1 |  |
| agent-a3de341d5a7a7c9ac | mayker-dev:orchestrator | n/a | - (+6 outside) | 6 | 16 | 3.2 | 2/1/2 | 6.50/1.00/1.00 | 4.6K | 52.9K | 59.2K | 0.813 | claude-fable-5-1 |  |
| agent-a61814872622cb9a7 | mayker-dev:reviewer | n/a | - (+5 outside) | 5 | 19 | 4.75 | 4/0/0 | 4.75/n/a/n/a | 5.2K | 48.8K | 58.1K | 0.762 | claude-opus-5-5 |  |
| agent-a62c5ec9c078ac99e | mayker-dev:planner | n/a | - (+8 outside) | 8 | 26 | 3.71 | 1/1/5 | 7.00/2.00/3.40 | 10.1K | 91.4K | 111.9K | 0.847 | claude-opus-5-5 |  |
| agent-a7e9f25eacb12008e | mayker-dev:builder | n/a | - (+4 outside) | 4 | 6 | 2.0 | 1/0/2 | 2.00/n/a/2.00 | 1.4K | 44.9K | 50.1K | 0.807 | claude-sonnet-5-5 |  |
| agent-aab29a204bc94d9d6 | mayker-dev:builder | n/a | - (+6 outside) | 6 | 12 | 2.4 | 2/1/2 | 4.00/1.00/1.50 | 3.1K | 51.8K | 56.9K | 0.866 | claude-sonnet-5-5 |  |
| agent-ab0e8a47aadd41136 | mayker-dev:orchestrator | deliver | 8 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 9.4K | 49.1K | 53.7K | 0.802 | claude-fable-5-1 |  |
| agent-ab408ff4cb4bcbbef | mayker-dev:orchestrator | n/a | - (+6 outside) | 6 | 11 | 2.2 | 1/1/3 | 7.00/1.00/1.00 | 4.1K | 47.9K | 51.6K | 0.872 | claude-fable-5-1 |  |
| agent-ac0d6166b3e76771b | mayker-dev:builder | n/a | - (+11 outside) | 11 | 15 | 1.5 | 2/2/6 | 3.00/1.50/1.00 | 5.3K | 57.0K | 62.5K | 0.925 | claude-sonnet-5-5 |  |
| agent-aead92c698dc00e45 | mayker-dev:builder | n/a | - (+7 outside) | 7 | 18 | 3.0 | 2/1/3 | 3.00/6.00/2.00 | 4.2K | 63.6K | 71.6K | 0.839 | claude-sonnet-5-5 |  |

**2 dispatch(es)** in `deliver` (mayker-dev:orchestrator 2): median ctx max 67.4K, peak 81.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 53.7K, 81.0K.

**8 dispatch(es)** outside every run's steps (mayker-dev:builder 4, mayker-dev:orchestrator 2, mayker-dev:planner 1, mayker-dev:reviewer 1): median ctx max 58.6K, peak 111.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.1K, 51.6K, 56.9K, 58.1K, 59.2K, 62.5K, 71.6K, 111.9K.

**10 dispatch(es)** across every run of this unit (mayker-dev:builder 4, mayker-dev:orchestrator 4, mayker-dev:planner 1, mayker-dev:reviewer 1): median ctx max 58.6K, peak 111.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.1K, 51.6K, 53.7K, 56.9K, 58.1K, 59.2K, 62.5K, 71.6K, 81.0K, 111.9K.

**All runs:** 1 run(s), wall 30m30s (sum of per-run walls, idle time between runs excluded), 138 turns, 231 tool calls, 92.2K output tokens, cache hit 0.948.

Turn classes across every bucket, read / edit / exec: 22/20/74 turns, 3.68/1.70/1.41 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 21m35s of round trip (command plus model time, ADR 0006 section 2): 71% of wall.

All runs: CI wait: 13m31s in `ci-poll.sh` calls; framework wall (wall less CI wait) 16m59s.

120 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 19/17/67).

10 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/8).
