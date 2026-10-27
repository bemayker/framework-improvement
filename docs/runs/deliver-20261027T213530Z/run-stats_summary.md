# Run statistics, run

Generated 2026-10-27 22:29 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 overlapping step window pair(s) detected WITHIN a single invocation; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. A lifecycle's steps are strictly sequential, so this is step markers written out of order by the session that wrote them — a WRITER defect, and no statement at all about how many units ran at once.

**Overlapping windows:** deliver step 5 and deliver step 3.orchestrator #2 overlap by 161s.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 4m47s | 13 | 30 | 2.5 | 6 | 25.3K | 91.0K | 122.0K | 0 | 0.877 | claude-fable-5-1 | 1/4/6 | 4.00/2.25/2.67 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 4m47s | 13 | 30 | 2.5 | 6 | 25.3K | 91.0K | 122.0K | 0 | 0.877 | claude-fable-5-1 | 1/4/6 | 4.00/2.25/2.67 |  |
| 5 | Scheduler loop | 46m37s | 531 | 1042 | 2.22 | 13 | 429.1K | 152.3K | 454.8K | 0 | 0.961 | claude-opus-5-5 | 73/83/286 | 4.59/2.01/1.63 |  |
| 3.orchestrator #2 | Re-ingestion dispatch | 2m41s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Final report | 2m38s | 5 | 8 | 2.0 | 5 | 16.0K | 217.0K | 468.9K | 0 | 0.945 | claude-fable-5-1 | 2/1/0 | 3.00/1.00/n/a |  |
| **run total** |  | 54m02s | 549 | 1080 | 2.22 | 13 | 470.4K |  | 468.9K |  | 0.96 | claude-opus-5-5 | 76/88/292 (exec 77% of wall) | 4.54/2.01/1.65 |  |

Wall is this run's last step end minus its first step start; steps sum to 56m43s.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 41m49s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

CI wait: 7m57s in `ci-poll.sh` calls; framework wall (wall less CI wait) 46m05s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a01c408f72c06889a | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 1/2/3 | 4.00/4.50/2.67 | 8.4K | 67.9K | 77.7K | 0.864 | claude-sonnet-5-5 |  |
| agent-a03fc38e74a0e781d | mayker-dev:builder | deliver | 5 | 6 | 15 | 3.0 | 1/2/2 | 6.00/3.50/1.00 | 5.1K | 64.7K | 73.9K | 0.81 | claude-sonnet-5-5 |  |
| agent-a0844dc144af9c239 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 3.00/1.00/1.67 | 3.6K | 44.2K | 48.7K | 0.816 | claude-fable-5-1 |  |
| agent-a0a7c48ee0cd51232 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.50/1.00/1.00 | 3.2K | 62.7K | 70.6K | 0.848 | claude-sonnet-5-5 |  |
| agent-a0cbc882e257cea6f | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 5.00/3.00/1.00 | 4.9K | 50.9K | 55.5K | 0.862 | claude-sonnet-5-5 |  |
| agent-a12b859400fab3993 | mayker-dev:planner | deliver | 5 | 14 | 44 | 3.38 | 2/2/8 | 3.00/1.50/3.12 | 33.3K | 128.0K | 165.3K | 0.915 | claude-opus-5-5 |  |
| agent-a1690d4ceff64cc2b | mayker-dev:builder | deliver | 5 | 14 | 25 | 1.92 | 3/1/8 | 2.67/3.00/1.62 | 7.1K | 71.7K | 80.0K | 0.934 | claude-sonnet-5-5 |  |
| agent-a189c323f2886607f | mayker-dev:planner | deliver | 5 | 18 | 40 | 2.35 | 2/2/12 | 4.00/1.50/1.67 | 21.3K | 118.4K | 141.1K | 0.934 | claude-opus-5-5 |  |
| agent-a1a8c51dbb0f7776b | mayker-dev:builder | deliver | 5 | 15 | 25 | 1.79 | 2/1/10 | 3.00/2.00/1.60 | 7.7K | 79.4K | 91.0K | 0.935 | claude-sonnet-5-5 |  |
| agent-a1c80daa7289fdcb9 | mayker-dev:builder | deliver | 5 | 5 | 16 | 4.0 | 2/1/1 | 6.50/2.00/1.00 | 3.4K | 54.6K | 63.1K | 0.818 | claude-sonnet-5-5 |  |
| agent-a236946d32e4ca975 | mayker-dev:builder | deliver | 5 | 13 | 25 | 2.08 | 2/1/8 | 3.00/4.00/1.75 | 5.7K | 57.1K | 63.5K | 0.932 | claude-sonnet-5-5 |  |
| agent-a2b1e39759b946df6 | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 1/1/4 | 3.00/3.00/1.00 | 4.3K | 52.3K | 56.7K | 0.881 | claude-sonnet-5-5 |  |
| agent-a2c77f3e3d4d728f0 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 5.4K | 49.2K | 62.0K | 0.685 | claude-opus-5-5 |  |
| agent-a2e5a470ea6b60e02 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 5.00/1.00/1.33 | 6.2K | 54.9K | 60.6K | 0.875 | claude-fable-5-1 |  |
| agent-a32bd15313d002a96 | mayker-dev:orchestrator | deliver | 5 | 8 | 11 | 1.57 | 1/2/4 | 4.00/1.00/1.25 | 4.1K | 47.4K | 51.3K | 0.864 | claude-fable-5-1 |  |
| agent-a36448a71a3c64b0f | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 5.3K | 57.8K | 64.9K | 0.85 | claude-fable-5-1 |  |
| agent-a45012a31da99edf5 | mayker-dev:builder | deliver | 5 | 9 | 26 | 3.25 | 2/2/4 | 3.00/5.50/2.25 | 8.5K | 71.0K | 81.1K | 0.873 | claude-sonnet-5-5 |  |
| agent-a4dd20fb2a975eaeb | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 6.7K | 48.5K | 69.5K | 0.586 | claude-opus-5-5 |  |
| agent-a542711e9f43c49f3 | mayker-dev:orchestrator | deliver | 5 | 8 | 20 | 2.86 | 1/2/4 | 4.00/2.50/2.75 | 12.6K | 76.2K | 98.2K | 0.839 | claude-fable-5-1 |  |
| agent-a54350e2be6e60c16 | mayker-dev:planner | deliver | 5 | 10 | 32 | 3.56 | 2/1/6 | 4.50/2.00/3.50 | 15.0K | 109.3K | 131.4K | 0.88 | claude-opus-5-5 |  |
| agent-a6256b488415d2ac8 | mayker-dev:builder | deliver | 5 | 6 | 7 | 1.4 | 0/0/5 | n/a/n/a/1.40 | 1.7K | 39.3K | 42.3K | 0.877 | claude-sonnet-5-5 |  |
| agent-a67aa4257a0765d21 | mayker-dev:planner | deliver | 5 | 11 | 35 | 3.5 | 1/1/7 | 6.00/2.00/2.57 | 16.9K | 118.7K | 147.4K | 0.897 | claude-opus-5-5 |  |
| agent-a6b5e98cad5df8405 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.50/1.50/1.00 | 7.6K | 58.0K | 64.3K | 0.902 | claude-sonnet-5-5 |  |
| agent-a6c8e6b9cb7c9eff0 | mayker-dev:planner | deliver | 5 | 14 | 40 | 3.08 | 1/2/8 | 2.00/1.50/2.62 | 19.1K | 127.0K | 154.1K | 0.921 | claude-opus-5-5 |  |
| agent-a752db15d172a8b32 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 1/1/3 | 4.00/1.00/1.33 | 3.5K | 45.5K | 49.1K | 0.866 | claude-fable-5-1 |  |
| agent-a78624cbc758a6edc | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 9.00/1.00/1.00 | 6.7K | 61.6K | 69.4K | 0.846 | claude-fable-5-1 |  |
| agent-a902a2177e2c0e7fe | mayker-dev:orchestrator | deliver | 5 | 8 | 17 | 2.43 | 1/1/5 | 3.00/1.00/2.60 | 6.1K | 51.7K | 61.7K | 0.881 | claude-fable-5-1 |  |
| agent-a9f3850ecdbd01bd7 | mayker-dev:builder | deliver | 5 | 5 | 14 | 3.5 | 2/1/1 | 6.00/1.00/1.00 | 3.3K | 54.2K | 62.2K | 0.819 | claude-sonnet-5-5 |  |
| agent-aacca118118f44d2f | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 487 | 36.3K | 38.0K | 0.661 | claude-sonnet-5-5 |  |
| agent-aaff22094d16d5bb8 | mayker-dev:orchestrator | deliver | 8 | 3 | 6 | 3.0 | 2/0/0 | 3.00/n/a/n/a | 7.3K | 52.3K | 59.5K | 0.71 | claude-fable-5-1 |  |
| agent-acc23aeb34926aebe | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/1/6 | 2.50/2.00/1.00 | 5.5K | 54.0K | 60.1K | 0.913 | claude-sonnet-5-5 |  |
| agent-ad15ec4de2c184912 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 2/1/2 | 5.50/2.00/1.00 | 6.1K | 61.5K | 69.4K | 0.846 | claude-fable-5-1 |  |
| agent-ad420a2675dff63e5 | mayker-dev:builder | deliver | 5 | 9 | 17 | 2.12 | 2/3/3 | 4.00/2.00/1.00 | 4.3K | 57.9K | 63.8K | 0.903 | claude-sonnet-5-5 |  |
| agent-ada8d80fb25cfa2ad | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 2.8K | 54.8K | 61.6K | 0.853 | claude-sonnet-5-5 |  |
| agent-adb5f4811b4acc0fd | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 535 | 36.3K | 38.0K | 0.66 | claude-sonnet-5-5 |  |
| agent-adbc087aaabc30807 | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 5.7K | 49.8K | 69.3K | 0.598 | claude-opus-5-5 |  |
| agent-adbc51f62751e268e | mayker-dev:orchestrator | deliver | 5 | 9 | 13 | 1.86 | 2/1/4 | 4.00/1.00/1.00 | 6.6K | 52.9K | 60.7K | 0.872 | claude-fable-5-1 |  |
| agent-ae3a1d76313eccc2d | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 0/0/3 | n/a/n/a/2.00 | 1.1K | 40.8K | 45.1K | 0.806 | claude-sonnet-5-5 |  |
| agent-ae3df062595eafbfd | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.9K | 46.6K | 63.1K | 0.548 | claude-opus-5-5 |  |
| agent-ae406c292a6c79845 | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 8.00/2.00/1.33 | 5.5K | 51.3K | 56.6K | 0.816 | claude-fable-5-1 |  |
| agent-ae44114c46f817ed6 | mayker-dev:builder | deliver | 5 | 8 | 28 | 4.0 | 2/3/2 | 6.50/4.33/1.00 | 8.4K | 68.9K | 78.3K | 0.882 | claude-sonnet-5-5 |  |
| agent-ae6be4d86a77a250a | mayker-dev:orchestrator | deliver | 3 | 10 | 25 | 2.78 | 1/3/5 | 4.00/2.00/3.00 | 22.4K | 92.8K | 122.0K | 0.868 | claude-fable-5-1 |  |
| agent-ae953ac3aa0954c1e | mayker-dev:builder | deliver | 5 | 13 | 16 | 1.33 | 2/2/8 | 2.50/1.50/1.00 | 8.2K | 57.6K | 64.3K | 0.932 | claude-sonnet-5-5 |  |
| agent-aebebd9e96ece6160 | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 6.0 | 3/0/0 | 6.00/n/a/n/a | 5.4K | 52.3K | 67.0K | 0.68 | claude-opus-5-5 |  |
| agent-af40f3ab485708409 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 0/0/2 | n/a/n/a/2.00 | 1.0K | 39.4K | 44.5K | 0.737 | claude-sonnet-5-5 |  |
| agent-afa5f647dd276c4cc | mayker-dev:builder | deliver | 5 | 8 | 24 | 3.43 | 2/2/3 | 5.00/5.50/1.00 | 8.2K | 72.3K | 81.9K | 0.881 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 64.1K, peak 165.3K, 0 above the auto threshold (80% of the serving model's window). Distribution: 38.0K, 38.0K, 42.3K, 44.5K, 45.1K, 48.7K, 49.1K, 51.3K, 55.5K, 56.6K, 56.7K, 59.5K, 60.1K, 60.6K, 60.7K, 61.6K, 61.7K, 62.0K, 62.2K, 63.1K, 63.1K, 63.5K, 63.8K, 64.3K, 64.3K, 64.9K, 67.0K, 69.3K, 69.4K, 69.4K, 69.5K, 70.6K, 73.9K, 77.7K, 78.3K, 80.0K, 81.1K, 81.9K, 91.0K, 98.2K, 122.0K, 131.4K, 141.1K, 147.4K, 154.1K, 165.3K.

**All runs:** 1 run(s), wall 54m02s (sum of per-run walls, idle time between runs excluded), 549 turns, 1080 tool calls, 470.4K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 76/88/292 turns, 4.54/2.01/1.65 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 41m49s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

All runs: CI wait: 7m57s in `ci-poll.sh` calls; framework wall (wall less CI wait) 46m05s.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/9).
