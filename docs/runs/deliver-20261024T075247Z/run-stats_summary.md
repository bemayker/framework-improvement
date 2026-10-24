# Run statistics, run

Generated 2026-10-24 08:48 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 41 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 2 overlapping step window pair(s) detected WITHIN a single invocation; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. A lifecycle's steps are strictly sequential, so this is step markers written out of order by the session that wrote them — a WRITER defect, and no statement at all about how many units ran at once.

**Overlapping windows:** deliver step W and deliver step 3.orchestrator #2 overlap by 208s.

**Overlapping windows:** deliver step W and deliver step 3.orchestrator #3 overlap by 147s.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 4m49s | 12 | 27 | 2.45 | 6 | 20.5K | 87.2K | 115.1K | 0 | 0.874 | claude-fable-5-1 | 1/2/7 | 4.00/2.00/2.57 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 4m49s | 12 | 27 | 2.45 | 6 | 20.5K | 87.2K | 115.1K | 0 | 0.874 | claude-fable-5-1 | 1/2/7 | 4.00/2.00/2.57 |  |
| W | Wave boundary (wave 3) | 24m17s | 135 | 246 | 2.02 | 10 | 104.5K | 182.2K | 404.9K | 1 | 0.969 | claude-opus-5-5 | 18/23/72 | 4.17/2.00/1.61 |  |
| 3.orchestrator #2 | Re-ingestion dispatch | 3m28s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 3.orchestrator #3 | Re-ingestion dispatch | 2m27s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Final report | 2m42s | 6 | 11 | 2.2 | 6 | 14.0K | 234.1K | 421.6K | 0 | 0.955 | claude-fable-5-1 | 2/1/1 | 3.50/2.00/1.00 |  |
| **run total** |  | 55m49s | 153 | 284 | 2.06 | 10 | 139.0K |  | 421.6K |  | 0.965 | claude-opus-5-5 | 21/26/80 (exec 38% of wall) | 4.10/2.00/1.69 |  |

Wall is this run's last step end minus its first step start; steps sum to 37m43s.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 21m21s of round trip (command plus model time, ADR 0006 section 2): 38% of wall.

CI wait: 2m44s in `ci-poll.sh` calls; framework wall (wall less CI wait) 53m04s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a05f76979751e3009 | mayker-dev:builder | n/a | - (+12 outside) | 12 | 26 | 2.36 | 1/1/8 | 1.00/5.00/2.38 | 5.2K | 64.8K | 74.9K | 0.921 | claude-sonnet-5-5 |  |
| agent-a078034f6fe926ace | mayker-dev:builder | n/a | - (+8 outside) | 8 | 11 | 1.57 | 2/1/4 | 2.00/2.00/1.25 | 5.2K | 52.5K | 59.6K | 0.889 | claude-sonnet-5-5 |  |
| agent-a0ec44847ceb653d2 | mayker-dev:builder | deliver | W | 7 | 16 | 2.67 | 2/2/2 | 3.50/3.50/1.00 | 5.4K | 54.3K | 60.7K | 0.878 | claude-sonnet-5-5 |  |
| agent-a0f4929e25f58354c | mayker-dev:orchestrator | n/a | - (+7 outside) | 7 | 11 | 1.83 | 2/1/3 | 3.50/1.00/1.00 | 4.6K | 53.9K | 62.9K | 0.833 | claude-fable-5-1 |  |
| agent-a1a31286709c885ee | mayker-dev:builder | n/a | - (+9 outside) | 9 | 16 | 2.0 | 1/3/4 | 5.00/2.33/1.00 | 4.0K | 53.4K | 58.8K | 0.905 | claude-sonnet-5-5 |  |
| agent-a1db782f0c159852e | mayker-dev:builder | n/a | - (+5 outside) | 5 | 13 | 3.25 | 2/1/1 | 5.00/2.00/1.00 | 2.9K | 51.6K | 58.9K | 0.823 | claude-sonnet-5-5 |  |
| agent-a1f406f2592f510d3 | mayker-dev:planner | deliver | W | 13 | 33 | 2.75 | 1/2/9 | 6.00/1.50/2.67 | 16.7K | 103.1K | 122.0K | 0.909 | claude-opus-5-5 |  |
| agent-a2465576f83fffc4a | mayker-dev:builder | n/a | - (+4 outside) | 4 | 3 | 1.0 | 1/0/2 | 1.00/n/a/1.00 | 845 | 40.0K | 44.6K | 0.804 | claude-sonnet-5-5 |  |
| agent-a2f5fe199fb736f81 | mayker-dev:orchestrator | deliver | W | 7 | 13 | 2.17 | 2/1/3 | 3.50/1.00/1.67 | 4.0K | 52.6K | 59.8K | 0.837 | claude-fable-5-1 |  |
| agent-a37fa01e52526a30c | mayker-dev:builder | deliver | W | 11 | 23 | 2.3 | 2/3/5 | 4.00/3.33/1.00 | 7.3K | 68.4K | 76.3K | 0.899 | claude-sonnet-5-5 |  |
| agent-a44bd60a89ba5fb15 | mayker-dev:reviewer | n/a | - (+4 outside) | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.9K | 53.2K | 68.9K | 0.676 | claude-opus-5-5 |  |
| agent-a552ca703a99efb7a | mayker-dev:builder | n/a | - (+4 outside) | 4 | 5 | 1.67 | 1/0/2 | 1.00/n/a/2.00 | 1.2K | 42.2K | 48.8K | 0.789 | claude-sonnet-5-5 |  |
| agent-a572513ba91c59ba1 | mayker-dev:builder | deliver | W | 11 | 18 | 1.8 | 2/1/6 | 3.50/4.00/1.00 | 4.9K | 65.1K | 71.6K | 0.92 | claude-sonnet-5-5 |  |
| agent-a58c413632ff2c00c | mayker-dev:builder | n/a | - (+16 outside) | 16 | 27 | 1.8 | 3/1/11 | 2.33/2.00/1.64 | 7.9K | 73.9K | 83.5K | 0.941 | claude-sonnet-5-5 |  |
| agent-a652c41bfb1366ac6 | mayker-dev:builder | deliver | W | 2 | 3 | 3.0 | 0/0/1 | n/a/n/a/3.00 | 543 | 42.9K | 50.2K | 0.583 | claude-sonnet-5-5 |  |
| agent-a68ad9811c8bb1251 | mayker-dev:builder | n/a | - (+10 outside) | 10 | 16 | 1.78 | 2/2/5 | 2.50/1.50/1.60 | 7.8K | 65.7K | 75.9K | 0.905 | claude-sonnet-5-5 |  |
| agent-a702b7aa586ce4940 | mayker-dev:orchestrator | deliver | 8 | 3 | 7 | 3.5 | 2/0/0 | 3.50/n/a/n/a | 6.4K | 52.3K | 59.9K | 0.706 | claude-fable-5-1 |  |
| agent-a7726f8a66bb990e3 | mayker-dev:orchestrator | deliver | W | 7 | 16 | 2.67 | 2/1/3 | 4.00/1.00/2.33 | 4.6K | 50.5K | 54.7K | 0.884 | claude-fable-5-1 |  |
| agent-a77d556ddd9d1b25e | mayker-dev:orchestrator | n/a | - (+6 outside) | 6 | 13 | 2.6 | 2/1/2 | 4.00/1.00/2.00 | 4.4K | 46.9K | 51.9K | 0.815 | claude-fable-5-1 |  |
| agent-a78f7f6f2c92d7a54 | mayker-dev:reviewer | n/a | - (+4 outside) | 4 | 23 | 7.67 | 3/0/0 | 7.67/n/a/n/a | 6.2K | 54.0K | 70.3K | 0.717 | claude-opus-5-5 |  |
| agent-a7bf8e0b53a7b5c63 | mayker-dev:planner | n/a | - (+12 outside) | 12 | 29 | 2.64 | 2/2/6 | 4.00/1.50/1.83 | 15.4K | 93.5K | 114.1K | 0.91 | claude-opus-5-5 |  |
| agent-a7ec7ac45a9194760 | mayker-dev:orchestrator | deliver | 3 | 9 | 23 | 2.88 | 1/1/6 | 4.00/2.00/2.83 | 18.4K | 89.7K | 115.1K | 0.857 | claude-fable-5-1 |  |
| agent-a820dfea6069f1d66 | mayker-dev:planner | n/a | - (+14 outside) | 14 | 39 | 3.0 | 2/2/9 | 4.00/1.50/3.11 | 29.3K | 103.6K | 133.0K | 0.917 | claude-opus-5-5 |  |
| agent-a82589b40711c8307 | mayker-dev:reviewer | n/a | - (+2 outside) | 2 | 6 | 6.0 | 1/0/0 | 6.00/n/a/n/a | 2.0K | 35.9K | 45.9K | 0.49 | claude-opus-5-5 |  |
| agent-a870d56c06b6e0591 | mayker-dev:planner | n/a | - (+17 outside) | 17 | 37 | 2.31 | 3/2/10 | 3.00/1.50/1.70 | 22.1K | 104.4K | 131.5K | 0.926 | claude-opus-5-5 |  |
| agent-a88394c06b7719935 | mayker-dev:builder | n/a | - (+15 outside) | 15 | 19 | 1.36 | 2/2/10 | 1.50/1.50/1.30 | 7.6K | 51.8K | 57.5K | 0.943 | claude-sonnet-5-5 |  |
| agent-a8eab925763ab5e2c | mayker-dev:builder | deliver | W | 7 | 11 | 1.83 | 2/1/3 | 2.00/2.00/1.67 | 4.2K | 52.9K | 60.1K | 0.877 | claude-sonnet-5-5 |  |
| agent-a8f8cdefd7dd5240b | mayker-dev:orchestrator | n/a | - (+7 outside) | 7 | 20 | 3.33 | 3/1/2 | 3.33/1.00/4.50 | 7.3K | 54.7K | 62.5K | 0.869 | claude-fable-5-1 |  |
| agent-a96d765f19b0d67c0 | mayker-dev:builder | n/a | - (+6 outside) | 6 | 28 | 5.6 | 1/1/3 | 10.00/12.00/2.00 | 8.4K | 65.6K | 78.6K | 0.834 | claude-sonnet-5-5 |  |
| agent-aa80a3b31f5e7f1f4 | mayker-dev:orchestrator | deliver | W | 7 | 15 | 2.5 | 1/2/3 | 5.00/1.50/2.33 | 8.4K | 62.2K | 72.2K | 0.865 | claude-fable-5-1 |  |
| agent-ab46a8ede41bf1805 | mayker-dev:builder | n/a | - (+2 outside) | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 411 | 36.2K | 38.1K | 0.655 | claude-sonnet-5-5 |  |
| agent-ac6a953301dac87e1 | mayker-dev:orchestrator | deliver | W | 7 | 14 | 2.8 | 1/1/3 | 5.00/2.00/2.33 | 12.7K | 64.2K | 77.3K | 0.828 | claude-fable-5-1 |  |
| agent-ac9788cd5a749cc2f | mayker-dev:orchestrator | n/a | - (+6 outside) | 6 | 12 | 2.4 | 1/1/3 | 4.00/1.00/2.33 | 4.5K | 50.9K | 57.6K | 0.852 | claude-fable-5-1 |  |
| agent-ad8b0a533c5ed0ef6 | mayker-dev:orchestrator | n/a | - (+6 outside) | 6 | 15 | 3.0 | 1/1/3 | 7.00/1.00/2.33 | 4.0K | 48.5K | 52.9K | 0.861 | claude-fable-5-1 |  |
| agent-ae3c0d9e88fe2c95e | mayker-dev:builder | n/a | - (+5 outside) | 5 | 10 | 2.5 | 2/1/1 | 3.50/2.00/1.00 | 2.6K | 52.2K | 60.0K | 0.821 | claude-sonnet-5-5 |  |
| agent-ae41f6a6a7a68b8b6 | mayker-dev:orchestrator | n/a | - (+7 outside) | 7 | 14 | 2.33 | 2/1/3 | 3.50/1.00/2.00 | 5.0K | 55.1K | 64.4K | 0.865 | claude-fable-5-1 |  |
| agent-aeaf740c8a6bf3874 | mayker-dev:builder | n/a | - (+6 outside) | 6 | 7 | 1.4 | 1/2/2 | 2.00/1.50/1.00 | 4.1K | 41.2K | 44.1K | 0.875 | claude-sonnet-5-5 |  |
| agent-aed2b82746cd61c39 | mayker-dev:reviewer | n/a | - (+4 outside) | 4 | 14 | 4.67 | 3/0/0 | 4.67/n/a/n/a | 4.9K | 49.8K | 62.9K | 0.731 | claude-opus-5-5 |  |
| agent-aeef7ee9af9362fb5 | mayker-dev:reviewer | deliver | W | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 6.3K | 51.2K | 65.4K | 0.681 | claude-opus-5-5 |  |
| agent-afaefac7176c8c22d | mayker-dev:builder | n/a | - (+11 outside) | 11 | 30 | 3.0 | 4/3/3 | 2.75/5.00/1.33 | 10.3K | 71.8K | 82.6K | 0.912 | claude-sonnet-5-5 |  |
| agent-afce313575c2d7235 | mayker-dev:builder | n/a | - (+6 outside) | 6 | 15 | 3.0 | 1/2/2 | 5.00/4.00/1.00 | 5.3K | 48.4K | 54.4K | 0.812 | claude-sonnet-5-5 |  |

**28 dispatch(es)** outside every run's steps (mayker-dev:builder 15, mayker-dev:orchestrator 6, mayker-dev:planner 3, mayker-dev:reviewer 4): median ctx max 61.2K, peak 133.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.1K, 44.1K, 44.6K, 45.9K, 48.8K, 51.9K, 52.9K, 54.4K, 57.5K, 57.6K, 58.8K, 58.9K, 59.6K, 60.0K, 62.5K, 62.9K, 62.9K, 64.4K, 68.9K, 70.3K, 74.9K, 75.9K, 78.6K, 82.6K, 83.5K, 114.1K, 131.5K, 133.0K.

**13 dispatch(es)** in `deliver` (mayker-dev:builder 5, mayker-dev:orchestrator 6, mayker-dev:planner 1, mayker-dev:reviewer 1): median ctx max 65.4K, peak 122.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 50.2K, 54.7K, 59.8K, 59.9K, 60.1K, 60.7K, 65.4K, 71.6K, 72.2K, 76.3K, 77.3K, 115.1K, 122.0K.

**41 dispatch(es)** across every run of this unit (mayker-dev:builder 20, mayker-dev:orchestrator 12, mayker-dev:planner 4, mayker-dev:reviewer 5): median ctx max 62.5K, peak 133.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.1K, 44.1K, 44.6K, 45.9K, 48.8K, 50.2K, 51.9K, 52.9K, 54.4K, 54.7K, 57.5K, 57.6K, 58.8K, 58.9K, 59.6K, 59.8K, 59.9K, 60.0K, 60.1K, 60.7K, 62.5K, 62.9K, 62.9K, 64.4K, 65.4K, 68.9K, 70.3K, 71.6K, 72.2K, 74.9K, 75.9K, 76.3K, 77.3K, 78.6K, 82.6K, 83.5K, 114.1K, 115.1K, 122.0K, 131.5K, 133.0K.

**All runs:** 1 run(s), wall 55m49s (sum of per-run walls, idle time between runs excluded), 499 turns, 923 tool calls, 401.4K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 79/70/262 turns, 3.75/2.04/1.65 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 44m00s of round trip (command plus model time, ADR 0006 section 2): 79% of wall.

All runs: CI wait: 7m12s in `ci-poll.sh` calls; framework wall (wall less CI wait) 48m36s.

346 turn(s) fell outside every recorded step window (included in the all-runs totals; read/edit/exec 58/44/182).

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/8).
