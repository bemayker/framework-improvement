# Run statistics, run

Generated 2026-10-22 21:10 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 53 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 overlapping step window pair(s) detected WITHIN a single invocation; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. A lifecycle's steps are strictly sequential, so this is step markers written out of order by the session that wrote them — a WRITER defect, and no statement at all about how many units ran at once.

**Overlapping windows:** deliver step 5 and deliver step 3.orchestrator #2 overlap by 2544s.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 4m01s | 12 | 31 | 2.82 | 7 | 20.0K | 97.4K | 137.3K | 0 | 0.868 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/3.50 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 4m01s | 12 | 31 | 2.82 | 7 | 20.0K | 97.4K | 137.3K | 0 | 0.868 | claude-fable-5-1 | 1/2/6 | 4.00/2.00/3.50 |  |
| 5 | Scheduler loop | 1h14m | 618 | 1203 | 2.22 | 15 | 487.5K | 153.2K | 477.1K | 0 | 0.962 | claude-opus-5-5 | 92/77/343 | 4.29/2.10/1.71 |  |
| 3.orchestrator #2 | Re-ingest at wave 2 boundary | 42m24s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 2 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Final report | 4m58s | 11 | 13 | 1.3 | 3 | 30.0K | 217.3K | 495.7K | 0 | 0.959 | claude-fable-5-1 | 1/3/5 | 3.00/1.00/1.20 |  |
| **run total** |  | 1h23m | 641 | 1247 | 2.21 | 15 | 537.5K |  | 495.7K |  | 0.961 | claude-opus-5-5 | 94/82/354 (exec 95% of wall) | 4.28/2.06/1.74 |  |

Wall is this run's last step end minus its first step start; steps sum to 2h05m.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 1h19m of round trip (command plus model time, ADR 0006 section 2): 95% of wall.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0023bba3d39e908c | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 897 | 42.0K | 47.2K | 0.735 | claude-sonnet-5-5 |  |
| agent-a02b9a14a16250f7f | mayker-dev:reviewer | deliver | 5 | 5 | 13 | 3.25 | 4/0/0 | 3.25/n/a/n/a | 4.5K | 47.1K | 57.5K | 0.798 | claude-opus-5-5 |  |
| agent-a09fdbe5040be59c3 | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 4.2K | 48.9K | 53.3K | 0.863 | claude-fable-5-1 |  |
| agent-a0cee387e1c3e88d9 | mayker-dev:orchestrator | deliver | 5 | 7 | 10 | 1.67 | 1/1/4 | 4.00/1.00/1.25 | 4.7K | 46.9K | 52.6K | 0.839 | claude-fable-5-1 |  |
| agent-a0d6682526d35b364 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 1/1/3 | 7.00/1.00/2.67 | 7.9K | 68.7K | 82.2K | 0.856 | claude-fable-5-1 |  |
| agent-a0d6a8f38baa478f5 | mayker-dev:builder | deliver | 5 | 14 | 32 | 2.46 | 2/1/9 | 3.00/4.00/2.33 | 7.7K | 72.6K | 83.7K | 0.931 | claude-sonnet-5-5 |  |
| agent-a0ebccf6239a0841f | mayker-dev:builder | deliver | 5 | 5 | 6 | 1.5 | 1/0/3 | 2.00/n/a/1.33 | 1.5K | 43.9K | 47.3K | 0.848 | claude-sonnet-5-5 |  |
| agent-a111a486e97bdc37f | mayker-dev:builder | deliver | 5 | 7 | 9 | 1.5 | 1/2/3 | 3.00/1.50/1.00 | 3.9K | 47.2K | 51.8K | 0.885 | claude-sonnet-5-5 |  |
| agent-a12056089757bc693 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 5.00/3.50/1.50 | 8.3K | 69.1K | 80.7K | 0.862 | claude-sonnet-5-5 |  |
| agent-a1dca4912c38b6da2 | mayker-dev:planner | deliver | 5 | 5 | 11 | 2.75 | 1/1/2 | 6.00/2.00/1.50 | 9.6K | 58.1K | 66.3K | 0.817 | claude-opus-5-5 |  |
| agent-a1ef696ef1788564b | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 8.00/2.00/1.67 | 6.4K | 51.2K | 56.9K | 0.814 | claude-fable-5-1 |  |
| agent-a25a45bdb92b4116d | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 3.00/1.00/1.75 | 5.7K | 53.2K | 61.5K | 0.886 | claude-fable-5-1 |  |
| agent-a27921e41d00af066 | mayker-dev:reviewer | deliver | 5 | 2 | 7 | 7.0 | 1/0/0 | 7.00/n/a/n/a | 2.0K | 36.6K | 46.6K | 0.499 | claude-opus-5-5 |  |
| agent-a318fc27f5d8c75dd | mayker-dev:builder | deliver | 5 | 9 | 21 | 2.62 | 1/2/5 | 4.00/3.00/2.20 | 6.2K | 71.9K | 82.8K | 0.872 | claude-sonnet-5-5 |  |
| agent-a356a15e9c4802755 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.8K | 55.8K | 72.9K | 0.718 | claude-opus-5-5 |  |
| agent-a35aa236ee7869465 | mayker-dev:planner | deliver | 5 | 16 | 35 | 2.33 | 1/1/13 | 4.00/2.00/2.23 | 21.1K | 102.2K | 131.8K | 0.919 | claude-opus-5-5 |  |
| agent-a365199ae4fce7e2d | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 1/1/5 | 4.00/1.00/2.40 | 5.1K | 58.3K | 68.4K | 0.853 | claude-fable-5-1 |  |
| agent-a419ef7ba46e54eeb | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 1/0/1 | 2.00/n/a/2.00 | 934 | 41.3K | 44.8K | 0.749 | claude-sonnet-5-5 |  |
| agent-a486a0891e345f873 | mayker-dev:builder | deliver | 5 | 7 | 34 | 5.67 | 2/2/2 | 7.50/8.50/1.00 | 10.2K | 72.4K | 85.1K | 0.859 | claude-sonnet-5-5 |  |
| agent-a49d1c09e8c79ee2a | mayker-dev:planner | deliver | 5 | 12 | 32 | 2.91 | 3/1/6 | 2.33/2.00/2.33 | 15.5K | 95.7K | 117.9K | 0.909 | claude-opus-5-5 |  |
| agent-a508e87efd1ce199d | mayker-dev:planner | deliver | 5 | 9 | 23 | 2.88 | 1/1/6 | 10.00/2.00/1.83 | 12.4K | 93.5K | 111.3K | 0.868 | claude-opus-5-5 |  |
| agent-a5600d4a65b26b564 | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 7.00/1.00/2.25 | 8.0K | 51.7K | 57.5K | 0.877 | claude-fable-5-1 |  |
| agent-a5f2b298f3561491b | mayker-dev:planner | deliver | 5 | 11 | 26 | 2.6 | 1/2/7 | 6.00/1.00/2.57 | 10.2K | 90.8K | 108.2K | 0.905 | claude-opus-5-5 |  |
| agent-a67d58a0cf4f0935c | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.4 | 2/1/2 | 3.50/3.00/1.00 | 3.0K | 61.1K | 68.9K | 0.812 | claude-sonnet-5-5 |  |
| agent-a6926286a9854e91d | mayker-dev:builder | deliver | 5 | 10 | 19 | 2.11 | 2/3/4 | 4.50/2.00/1.00 | 7.6K | 71.2K | 79.9K | 0.907 | claude-sonnet-5-5 |  |
| agent-a75bc5787fd908835 | mayker-dev:builder | deliver | 5 | 15 | 31 | 2.21 | 2/1/10 | 3.00/3.00/2.10 | 7.1K | 74.0K | 85.0K | 0.936 | claude-sonnet-5-5 |  |
| agent-a79f2861a80ff15a6 | mayker-dev:builder | deliver | 5 | 11 | 30 | 3.0 | 1/3/6 | 10.00/4.00/1.33 | 7.9K | 80.8K | 89.5K | 0.915 | claude-sonnet-5-5 |  |
| agent-a7cda87106b2f1337 | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 0/0/3 | n/a/n/a/1.33 | 1.2K | 38.0K | 39.9K | 0.828 | claude-sonnet-5-5 |  |
| agent-a8367d175593713de | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 6.8K | 49.9K | 72.7K | 0.514 | claude-opus-5-5 |  |
| agent-a85bd5b2bf9f429d3 | mayker-dev:builder | deliver | 5 | 10 | 16 | 1.78 | 2/2/5 | 3.50/1.50/1.20 | 7.1K | 64.9K | 73.9K | 0.907 | claude-sonnet-5-5 |  |
| agent-a876695376727635e | mayker-dev:builder | deliver | 5 | 11 | 18 | 1.8 | 1/1/8 | 3.00/2.00/1.62 | 6.5K | 67.3K | 76.5K | 0.915 | claude-sonnet-5-5 |  |
| agent-a89c7b22075d24408 | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/2/3 | 5.00/1.50/1.00 | 4.2K | 56.1K | 61.2K | 0.894 | claude-sonnet-5-5 |  |
| agent-a8fa69c12bf26c11e | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 7.2K | 56.2K | 75.3K | 0.709 | claude-opus-5-5 |  |
| agent-a96cd889abe8e3edb | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 4.00/2.00/2.00 | 8.0K | 63.2K | 79.4K | 0.85 | claude-fable-5-1 |  |
| agent-a98a4cdd6c9e037ff | mayker-dev:builder | deliver | 5 | 9 | 20 | 2.5 | 2/2/4 | 4.50/3.00/1.25 | 8.8K | 69.3K | 79.2K | 0.895 | claude-sonnet-5-5 |  |
| agent-aa155306f091c70a5 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 8.00/1.00/1.75 | 9.0K | 55.6K | 63.1K | 0.871 | claude-fable-5-1 |  |
| agent-aa25860f209b1c58e | mayker-dev:planner | deliver | 5 | 13 | 37 | 3.08 | 2/2/7 | 4.00/1.50/2.14 | 21.2K | 97.0K | 121.2K | 0.914 | claude-opus-5-5 |  |
| agent-aa9fb360a092da88a | mayker-dev:orchestrator | deliver | 8 | 7 | 9 | 1.5 | 1/1/4 | 3.00/1.00/1.25 | 20.8K | 63.8K | 79.0K | 0.823 | claude-fable-5-1 |  |
| agent-ab711b7522e1488d6 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 1/1/4 | 5.00/1.00/1.75 | 6.3K | 52.8K | 60.1K | 0.872 | claude-fable-5-1 |  |
| agent-abe485e3edf81f158 | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/1/4 | 3.50/2.00/1.50 | 5.8K | 69.3K | 79.0K | 0.882 | claude-sonnet-5-5 |  |
| agent-abe5cdedb0435ca0f | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 1/1/5 | 4.00/2.00/2.80 | 8.7K | 67.9K | 85.2K | 0.867 | claude-fable-5-1 |  |
| agent-abffad6dcc00a8225 | mayker-dev:builder | deliver | 5 | 13 | 26 | 2.17 | 1/1/10 | 4.00/2.00/2.00 | 7.7K | 72.2K | 81.7K | 0.928 | claude-sonnet-5-5 |  |
| agent-ac956e510b7b2623a | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 4.1K | 47.8K | 59.6K | 0.688 | claude-opus-5-5 |  |
| agent-ada244d78bed3ce70 | mayker-dev:builder | deliver | 5 | 3 | 6 | 3.0 | 0/0/2 | n/a/n/a/3.00 | 1.2K | 38.4K | 41.4K | 0.76 | claude-sonnet-5-5 |  |
| agent-ae76079da918dce8c | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 3/1/4 | 3.00/3.00/1.00 | 7.7K | 65.1K | 77.8K | 0.891 | claude-sonnet-5-5 |  |
| agent-ae9fcb8fa35d83c61 | mayker-dev:orchestrator | deliver | 3 | 9 | 27 | 3.38 | 1/1/5 | 4.00/2.00/4.00 | 17.5K | 103.2K | 137.3K | 0.852 | claude-fable-5-1 |  |
| agent-af1bbad1895230edd | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.00/1.00/2.00 | 3.9K | 50.0K | 56.5K | 0.811 | claude-fable-5-1 |  |
| agent-af4d2b946db7f8abb | mayker-dev:orchestrator | deliver | 5 | 7 | 19 | 3.17 | 3/1/2 | 3.00/1.00/4.50 | 6.0K | 53.5K | 59.8K | 0.875 | claude-fable-5-1 |  |
| agent-af4e87a651f77e886 | mayker-dev:builder | deliver | 5 | 11 | 17 | 1.7 | 1/3/6 | 5.00/2.00/1.00 | 4.6K | 55.0K | 59.2K | 0.925 | claude-sonnet-5-5 |  |
| agent-af7b18a6e30daab22 | mayker-dev:reviewer | deliver | 5 | 4 | 16 | 5.33 | 3/0/0 | 5.33/n/a/n/a | 6.8K | 54.9K | 73.4K | 0.666 | claude-opus-5-5 |  |
| agent-af883cb530d98aba2 | mayker-dev:orchestrator | deliver | 5 | 9 | 18 | 2.25 | 1/1/6 | 4.00/2.00/2.00 | 11.8K | 69.8K | 86.2K | 0.883 | claude-fable-5-1 |  |
| agent-af923eba06b043b6b | mayker-dev:builder | deliver | 5 | 7 | 12 | 2.0 | 2/1/3 | 4.00/1.00/1.00 | 2.9K | 61.1K | 67.2K | 0.875 | claude-sonnet-5-5 |  |
| agent-afc7f4a0de838003a | mayker-dev:builder | deliver | 5 | 9 | 22 | 2.75 | 2/2/4 | 3.50/3.50/2.00 | 8.3K | 74.6K | 85.6K | 0.893 | claude-sonnet-5-5 |  |

**53 dispatch(es)** in `deliver` (mayker-dev:builder 24, mayker-dev:orchestrator 16, mayker-dev:planner 6, mayker-dev:reviewer 7): median ctx max 73.4K, peak 137.3K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.9K, 41.4K, 44.8K, 46.6K, 47.2K, 47.3K, 51.8K, 52.6K, 53.3K, 56.5K, 56.9K, 57.5K, 57.5K, 59.2K, 59.6K, 59.8K, 60.1K, 61.2K, 61.5K, 63.1K, 66.3K, 67.2K, 68.4K, 68.9K, 72.7K, 72.9K, 73.4K, 73.9K, 75.3K, 76.5K, 77.8K, 79.0K, 79.0K, 79.2K, 79.4K, 79.9K, 80.7K, 81.7K, 82.2K, 82.8K, 83.7K, 85.0K, 85.1K, 85.2K, 85.6K, 86.2K, 89.5K, 108.2K, 111.3K, 117.9K, 121.2K, 131.8K, 137.3K.

**All runs:** 1 run(s), wall 1h23m (sum of per-run walls, idle time between runs excluded), 641 turns, 1247 tool calls, 537.5K output tokens, cache hit 0.961.

Turn classes across every bucket, read / edit / exec: 94/82/354 turns, 4.28/2.06/1.74 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 1h19m of round trip (command plus model time, ADR 0006 section 2): 95% of wall.

10 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/8).
