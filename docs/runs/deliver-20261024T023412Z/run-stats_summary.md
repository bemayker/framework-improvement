# Run statistics, run

Generated 2026-10-24 03:07 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 11 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

`deliver (20261023T201048Z)` ended before this session began, so its turn, token, model and dispatch figures (10 dispatch row(s)) are the ones the collection that covered it recorded, kept unchanged; the All runs line adds this session's turns to them (MDF-316).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 overlapping step window pair(s) detected WITHIN a single invocation; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. A lifecycle's steps are strictly sequential, so this is step markers written out of order by the session that wrote them — a WRITER defect, and no statement at all about how many units ran at once.

**Overlapping windows:** deliver (20261024T023412Z) step 5 and deliver (20261024T023412Z) step 3 #2 overlap by 139s.

## Run: deliver (20261023T201048Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 2m00s | 11 | 19 | 1.9 | 4 | 9.9K | 70.8K | 86.5K | 0 | 0.876 | claude-fable-5-1 | 1/2/5 | 4.00/2.00/1.80 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 2m00s | 11 | 19 | 1.9 | 4 | 9.9K | 70.8K | 86.5K | 0 | 0.876 | claude-fable-5-1 | 1/2/5 | 4.00/2.00/1.80 |  |
| 8 | Final report | 2m42s | 7 | 9 | 1.5 | 3 | 16.5K | 110.6K | 198.0K | 0 | 0.933 | claude-fable-5-1 | 2/1/2 | 2.00/2.00/1.00 |  |
| **run total** |  | 30m30s | 18 | 28 | 1.75 | 4 | 26.4K |  | 198.0K |  | 0.904 | claude-fable-5-1 | 3/3/7 (exec 3% of wall) | 2.67/2.00/1.57 |  |

Wall is this run's last step end minus its first step start; steps sum to 4m42s.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 0m52s of round trip (command plus model time, ADR 0006 section 2): 3% of wall.

## Run: deliver (20261024T023412Z)

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Load context and the autonomy gate | 0m00s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3 | Ingest the backlog | 2m22s | 10 | 19 | 2.11 | 4 | 10.6K | 68.0K | 93.4K | 0 | 0.862 | claude-fable-5-1 | 1/2/5 | 4.00/2.50/1.80 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 2m22s | 10 | 19 | 2.11 | 4 | 10.6K | 68.0K | 93.4K | 0 | 0.862 | claude-fable-5-1 | 1/2/5 | 4.00/2.50/1.80 |  |
| 5 | The scheduler loop | 27m18s | 143 | 226 | 1.7 | 8 | 91.8K | 112.4K | 212.9K | 0 | 0.956 | claude-opus-5-5 | 16/19/84 | 3.62/1.42/1.49 |  |
| 3 #2 | Ingest the backlog | 2m19s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| 3.orchestrator #2 (in 3 #2) | Ingestion dispatch | 2m19s | 11 | 21 | 2.1 | 4 | 12.4K | 110.3K | 203.0K | 0 | 0.939 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/2.00 |  |
| 8 | Final report | 2m57s | 6 | 13 | 2.6 | 8 | 19.0K | 138.3K | 229.7K | 0 | 0.922 | claude-fable-5-1 | 1/1/2 | 2.00/1.00/4.50 |  |
| **run total** |  | 32m37s | 159 | 258 | 1.76 | 8 | 121.4K |  | 229.7K |  | 0.951 | claude-opus-5-5 | 18/22/91 (exec 63% of wall) | 3.56/1.50/1.57 |  |

Wall is this run's last step end minus its first step start; steps sum to 34m56s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 3 #2)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 20m40s of round trip (command plus model time, ADR 0006 section 2): 63% of wall.

CI wait: 9m48s in `ci-poll.sh` calls; framework wall (wall less CI wait) 22m48s.

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
| agent-a197551b878797a7d | mayker-dev:orchestrator | deliver | 5 | 8 | 10 | 1.67 | 2/1/3 | 3.00/1.00/1.00 | 5.2K | 50.5K | 55.4K | 0.863 | claude-fable-5-1 |  |
| agent-a2cf29ad2f6fe6e02 | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/1/4 | 3.50/2.00/1.50 | 4.7K | 71.2K | 79.4K | 0.888 | claude-sonnet-5-5 |  |
| agent-a345904e893ca7377 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 4.00/2.00/2.50 | 9.7K | 61.5K | 73.2K | 0.864 | claude-fable-5-1 |  |
| agent-a4f2b27e6e50cd2a6 | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 2/1/4 | 4.50/1.00/2.50 | 7.6K | 65.5K | 74.3K | 0.886 | claude-fable-5-1 |  |
| agent-a7cf37b932d5ed163 | mayker-dev:planner | deliver | 5 | 17 | 31 | 1.94 | 1/2/13 | 2.00/1.50/2.00 | 17.6K | 102.6K | 125.9K | 0.928 | claude-opus-5-5 |  |
| agent-aa25b7aed5c46375c | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 4.9K | 45.7K | 55.2K | 0.698 | claude-opus-5-5 |  |
| agent-ab091b222c5f149dc | mayker-dev:orchestrator | deliver | 3 | 7 | 14 | 2.33 | 1/1/4 | 4.00/2.00/2.00 | 8.5K | 62.1K | 74.5K | 0.828 | claude-fable-5-1 |  |
| agent-acb7a5ef562025bae | mayker-dev:orchestrator | deliver | 8 | 3 | 10 | 5.0 | 1/0/1 | 2.00/n/a/8.00 | 9.6K | 53.9K | 62.6K | 0.705 | claude-fable-5-1 |  |
| agent-ad3a43e7a5db32abd | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 5.00/2.00/2.00 | 3.1K | 63.1K | 69.8K | 0.842 | claude-sonnet-5-5 |  |
| agent-ad49fa5db6a61be8f | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 1/0/1 | 3.00/n/a/2.00 | 1.0K | 45.8K | 50.8K | 0.742 | claude-sonnet-5-5 |  |
| agent-af851ba28a940f52c | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 5.00/2.00/2.25 | 3.9K | 73.5K | 82.8K | 0.869 | claude-sonnet-5-5 |  |

**2 dispatch(es)** in `deliver (20261023T201048Z)` (mayker-dev:orchestrator 2): median ctx max 67.4K, peak 81.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 53.7K, 81.0K.

**8 dispatch(es)** outside every run's steps (mayker-dev:builder 4, mayker-dev:orchestrator 2, mayker-dev:planner 1, mayker-dev:reviewer 1): median ctx max 58.6K, peak 111.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.1K, 51.6K, 56.9K, 58.1K, 59.2K, 62.5K, 71.6K, 111.9K.

**11 dispatch(es)** in `deliver (20261024T023412Z)` (mayker-dev:builder 4, mayker-dev:orchestrator 5, mayker-dev:planner 1, mayker-dev:reviewer 1): median ctx max 73.2K, peak 125.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.8K, 55.2K, 55.4K, 62.6K, 69.8K, 73.2K, 74.3K, 74.5K, 79.4K, 82.8K, 125.9K.

**21 dispatch(es)** across every run of this unit (mayker-dev:builder 8, mayker-dev:orchestrator 9, mayker-dev:planner 2, mayker-dev:reviewer 2): median ctx max 62.6K, peak 125.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.1K, 50.8K, 51.6K, 53.7K, 55.2K, 55.4K, 56.9K, 58.1K, 59.2K, 62.5K, 62.6K, 69.8K, 71.6K, 73.2K, 74.3K, 74.5K, 79.4K, 81.0K, 82.8K, 111.9K, 125.9K.

**All runs:** 2 run(s), wall 1h03m (sum of per-run walls, idle time between runs excluded), 308 turns, 506 tool calls, 217.1K output tokens, cache hit 0.948.

Turn classes across every bucket, read / edit / exec: 42/42/173 turns, 3.52/1.60/1.50 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 42m41s of round trip (command plus model time, ADR 0006 section 2): 68% of wall.

All runs: CI wait: 23m20s in `ci-poll.sh` calls; framework wall (wall less CI wait) 39m47s.

131 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 21/17/75).
