# Run statistics, run

Generated 2026-10-27 21:20 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

**Degraded:** 1 overlapping step window pair(s) detected WITHIN a single invocation; timestamp bucketing gives the earlier-starting step the later one's turns, so the per-step numbers below are NOT trustworthy. A lifecycle's steps are strictly sequential, so this is step markers written out of order by the session that wrote them — a WRITER defect, and no statement at all about how many units ran at once.

**Overlapping windows:** deliver step 5 and deliver step 3.orchestrator #2 overlap by 1169s.

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 5m29s | 13 | 37 | 3.08 | 8 | 27.3K | 100.1K | 136.6K | 0 | 0.88 | claude-fable-5-1 | 2/2/7 | 3.00/2.50/3.57 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 5m29s | 13 | 37 | 3.08 | 8 | 27.3K | 100.1K | 136.6K | 0 | 0.88 | claude-fable-5-1 | 2/2/7 | 3.00/2.50/3.57 |  |
| 5 | Scheduler loop | 43m22s | 553 | 1099 | 2.27 | 14 | 455.2K | 143.7K | 458.2K | 0 | 0.958 | claude-opus-5-5 | 85/78/284 | 4.01/2.00/1.86 |  |
| 3.orchestrator #2 | Re-ingest at wave 2 boundary | 19m29s | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 1 | n/a | fable (marker, unverified) | 0/0/0 | n/a/n/a/n/a |  |
| 8 | Final report | 4m30s | 11 | 17 | 1.7 | 6 | 27.6K | 176.9K | 481.2K | 0 | 0.949 | claude-fable-5-1 | 0/1/8 | n/a/2.00/1.75 |  |
| **run total** |  | 53m21s | 577 | 1153 | 2.28 | 14 | 510.1K |  | 481.2K |  | 0.957 | claude-opus-5-5 | 87/81/299 (exec 82% of wall) | 3.99/2.01/1.89 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h12m.

Nested sub-span(s) `3.orchestrator (in 3)` lie wholly inside their own step: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 43m59s of round trip (command plus model time, ADR 0006 section 2): 82% of wall.

CI wait: 7m32s in `ci-poll.sh` calls; framework wall (wall less CI wait) 45m48s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a08d05049e5588963 | mayker-dev:builder | deliver | 5 | 11 | 17 | 1.7 | 2/1/7 | 2.50/1.00/1.57 | 3.9K | 56.2K | 67.3K | 0.914 | claude-sonnet-5-5 |  |
| agent-a0d32f265d94cfc12 | mayker-dev:reviewer | deliver | 5 | 5 | 23 | 5.75 | 4/0/0 | 5.75/n/a/n/a | 5.6K | 58.3K | 71.6K | 0.754 | claude-opus-5-5 |  |
| agent-a0f4d62bef37d8fa6 | mayker-dev:builder | deliver | 5 | 11 | 15 | 1.5 | 3/2/5 | 2.33/1.50/1.00 | 6.9K | 54.5K | 62.4K | 0.919 | claude-sonnet-5-5 |  |
| agent-a0fa4527ce124fe0d | mayker-dev:builder | deliver | 5 | 8 | 24 | 3.43 | 3/2/2 | 3.67/5.00/1.50 | 8.4K | 73.6K | 85.6K | 0.878 | claude-sonnet-5-5 |  |
| agent-a106c2f1628f981df | mayker-dev:builder | deliver | 5 | 8 | 25 | 3.57 | 1/1/5 | 4.00/8.00/2.60 | 7.4K | 71.7K | 82.9K | 0.88 | claude-sonnet-5-5 |  |
| agent-a14e34998e42e2b2d | mayker-dev:orchestrator | deliver | 5 | 9 | 19 | 2.38 | 2/1/5 | 3.00/2.00/2.20 | 12.2K | 75.2K | 91.3K | 0.885 | claude-fable-5-1 |  |
| agent-a15f6cb8a40484209 | mayker-dev:builder | deliver | 5 | 4 | 4 | 1.33 | 0/1/2 | n/a/1.00/1.50 | 1.2K | 38.1K | 39.5K | 0.833 | claude-sonnet-5-5 |  |
| agent-a16a3db7bc180d684 | mayker-dev:orchestrator | deliver | 3 | 10 | 33 | 3.67 | 2/1/6 | 3.00/3.00/4.00 | 24.9K | 105.0K | 136.6K | 0.87 | claude-fable-5-1 |  |
| agent-a18e9b913ff08f0a1 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 1/0/1 | 1.00/n/a/2.00 | 1.1K | 40.4K | 47.8K | 0.72 | claude-sonnet-5-5 |  |
| agent-a1cda0f045e5cad2b | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 1.50/1.50/1.60 | 7.5K | 55.4K | 63.4K | 0.911 | claude-sonnet-5-5 |  |
| agent-a1dc314c084abdf5b | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 1.50/2.00/1.20 | 5.9K | 48.2K | 53.5K | 0.918 | claude-sonnet-5-5 |  |
| agent-a1f77ad14984e76f7 | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 3/1/1 | 3.33/2.00/1.00 | 2.9K | 50.9K | 59.9K | 0.85 | claude-sonnet-5-5 |  |
| agent-a21ec36779e545e00 | mayker-dev:orchestrator | deliver | 5 | 8 | 19 | 2.71 | 1/1/4 | 5.00/1.00/3.00 | 5.6K | 57.2K | 66.0K | 0.855 | claude-fable-5-1 |  |
| agent-a260d124f3567e0f8 | mayker-dev:planner | deliver | 5 | 10 | 34 | 3.78 | 1/1/6 | 2.00/2.00/2.83 | 16.1K | 116.5K | 141.2K | 0.879 | claude-opus-5-5 |  |
| agent-a27604bcb8b95f991 | mayker-dev:orchestrator | deliver | 5 | 7 | 29 | 4.83 | 2/1/2 | 4.50/1.00/7.50 | 11.8K | 77.1K | 94.7K | 0.849 | claude-fable-5-1 |  |
| agent-a32e213fa98f83f79 | mayker-dev:builder | deliver | 5 | 8 | 22 | 3.14 | 1/2/4 | 6.00/6.00/1.00 | 7.2K | 69.3K | 77.9K | 0.859 | claude-sonnet-5-5 |  |
| agent-a38d80969b41ea2dd | mayker-dev:orchestrator | deliver | 5 | 9 | 21 | 2.62 | 2/1/4 | 5.00/1.00/2.25 | 7.2K | 59.6K | 66.5K | 0.901 | claude-fable-5-1 |  |
| agent-a482e125e3bc6c9e2 | mayker-dev:planner | deliver | 5 | 15 | 42 | 3.0 | 3/3/7 | 5.00/1.33/2.57 | 29.5K | 125.8K | 157.8K | 0.924 | claude-opus-5-5 |  |
| agent-a49b024d2ec3fc873 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 2/1/3 | 4.50/1.00/1.67 | 3.9K | 51.3K | 56.7K | 0.841 | claude-fable-5-1 |  |
| agent-a4fcdde2eda1789b3 | mayker-dev:planner | deliver | 5 | 12 | 31 | 2.82 | 2/2/5 | 4.50/1.50/2.40 | 18.4K | 107.3K | 134.6K | 0.895 | claude-opus-5-5 |  |
| agent-a5103303a685c3e69 | mayker-dev:builder | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 2.5K | 55.0K | 61.3K | 0.856 | claude-sonnet-5-5 |  |
| agent-a5231e3d5abd9b720 | mayker-dev:builder | deliver | 5 | 8 | 36 | 5.14 | 2/3/2 | 7.00/6.00/2.00 | 11.0K | 71.8K | 84.5K | 0.853 | claude-sonnet-5-5 |  |
| agent-a5a33eebf906a4a40 | mayker-dev:planner | deliver | 5 | 15 | 30 | 2.14 | 1/3/9 | 2.00/1.00/2.22 | 21.0K | 111.7K | 135.9K | 0.927 | claude-opus-5-5 |  |
| agent-a5c3e41070a869532 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 0/1/5 | n/a/1.00/2.80 | 5.2K | 51.1K | 56.9K | 0.878 | claude-fable-5-1 |  |
| agent-a728b141cd2ac1fb9 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/2/2 | 5.00/3.50/1.50 | 8.5K | 67.3K | 78.8K | 0.862 | claude-sonnet-5-5 |  |
| agent-a826927b98493d6a3 | mayker-dev:builder | deliver | 5 | 13 | 25 | 2.08 | 1/1/9 | 4.00/3.00/1.89 | 6.3K | 71.6K | 79.4K | 0.93 | claude-sonnet-5-5 |  |
| agent-a8aa4632a0e4d744e | mayker-dev:orchestrator | deliver | 5 | 8 | 25 | 3.57 | 1/1/5 | 7.00/1.00/3.40 | 6.7K | 61.8K | 71.0K | 0.856 | claude-fable-5-1 |  |
| agent-a8eaf3a5c185227c1 | mayker-dev:planner | deliver | 5 | 16 | 38 | 2.53 | 1/2/11 | 2.00/1.50/2.55 | 21.1K | 138.6K | 170.4K | 0.929 | claude-opus-5-5 |  |
| agent-a8f3e6a8209837b3d | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.6 | 3/2/5 | 2.00/1.50/1.40 | 7.4K | 57.8K | 65.1K | 0.919 | claude-sonnet-5-5 |  |
| agent-a9003da89444c1225 | mayker-dev:builder | deliver | 5 | 16 | 29 | 1.93 | 1/5/9 | 1.00/1.80/2.11 | 7.5K | 75.0K | 85.0K | 0.941 | claude-sonnet-5-5 |  |
| agent-a9a0b3731ba0f0cae | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 0/0/3 | n/a/n/a/1.67 | 1.7K | 42.4K | 47.6K | 0.802 | claude-sonnet-5-5 |  |
| agent-a9a0ee8f73fcc6a16 | mayker-dev:orchestrator | deliver | 8 | 8 | 13 | 1.86 | 0/0/7 | n/a/n/a/1.86 | 16.0K | 66.0K | 76.4K | 0.855 | claude-fable-5-1 |  |
| agent-aa37304f18a76133b | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 2/2/2 | 5.50/1.50/1.00 | 4.0K | 56.8K | 63.4K | 0.876 | claude-sonnet-5-5 |  |
| agent-ab04df674b78abd5b | mayker-dev:builder | deliver | 5 | 13 | 24 | 2.0 | 2/4/6 | 7.00/1.00/1.00 | 7.5K | 72.1K | 80.0K | 0.93 | claude-sonnet-5-5 |  |
| agent-abc6d4af58fcc6e3f | mayker-dev:reviewer | deliver | 5 | 3 | 20 | 10.0 | 2/0/0 | 10.00/n/a/n/a | 6.9K | 50.6K | 71.8K | 0.592 | claude-opus-5-5 |  |
| agent-abcbe6c553ec201cf | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 5.6K | 46.6K | 62.5K | 0.624 | claude-opus-5-5 |  |
| agent-ac2eb52232cf94eb0 | mayker-dev:reviewer | deliver | 5 | 5 | 16 | 4.0 | 4/0/0 | 4.00/n/a/n/a | 6.3K | 54.4K | 66.6K | 0.755 | claude-opus-5-5 |  |
| agent-ad48026086be2bce8 | mayker-dev:builder | deliver | 5 | 11 | 16 | 1.6 | 2/2/6 | 2.50/1.50/1.33 | 6.9K | 57.7K | 64.4K | 0.92 | claude-sonnet-5-5 |  |
| agent-ad58703e6543480f2 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 7.00/1.00/1.75 | 4.8K | 51.1K | 55.9K | 0.881 | claude-fable-5-1 |  |
| agent-adcef41f11e780586 | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.75 | 1/1/2 | 7.00/2.00/1.00 | 4.0K | 48.9K | 53.3K | 0.782 | claude-fable-5-1 |  |
| agent-ae1a21d00eb7b0829 | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 5.00/2.00/2.00 | 7.9K | 70.6K | 86.1K | 0.852 | claude-fable-5-1 |  |
| agent-aebe08b984b0e8b04 | mayker-dev:builder | deliver | 5 | 13 | 22 | 1.83 | 1/1/9 | 4.00/2.00/1.67 | 7.3K | 70.1K | 78.4K | 0.929 | claude-sonnet-5-5 |  |
| agent-aef6fdb96ede22f6a | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 6.00/1.00/1.67 | 4.0K | 55.0K | 62.9K | 0.85 | claude-fable-5-1 |  |
| agent-af486c33c15a28392 | mayker-dev:reviewer | deliver | 5 | 5 | 19 | 4.75 | 4/0/0 | 4.75/n/a/n/a | 6.2K | 55.8K | 69.2K | 0.788 | claude-opus-5-5 |  |
| agent-af803bedbb68e7c68 | mayker-dev:builder | deliver | 5 | 4 | 5 | 2.5 | 1/0/1 | 3.00/n/a/2.00 | 1.8K | 50.8K | 58.9K | 0.779 | claude-sonnet-5-5 |  |
| agent-af82b66ea737739aa | mayker-dev:orchestrator | deliver | 5 | 7 | 15 | 2.5 | 1/1/4 | 7.00/1.00/1.75 | 7.2K | 53.6K | 60.3K | 0.875 | claude-fable-5-1 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 22, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 68.2K, peak 170.4K, 0 above the auto threshold (80% of the serving model's window). Distribution: 39.5K, 47.6K, 47.8K, 53.3K, 53.5K, 55.9K, 56.7K, 56.9K, 58.9K, 59.9K, 60.3K, 61.3K, 62.4K, 62.5K, 62.9K, 63.4K, 63.4K, 64.4K, 65.1K, 66.0K, 66.5K, 66.6K, 67.3K, 69.2K, 71.0K, 71.6K, 71.8K, 76.4K, 77.9K, 78.4K, 78.8K, 79.4K, 80.0K, 82.9K, 84.5K, 85.0K, 85.6K, 86.1K, 91.3K, 94.7K, 134.6K, 135.9K, 136.6K, 141.2K, 157.8K, 170.4K.

**All runs:** 1 run(s), wall 53m21s (sum of per-run walls, idle time between runs excluded), 577 turns, 1153 tool calls, 510.1K output tokens, cache hit 0.957.

Turn classes across every bucket, read / edit / exec: 87/81/299 turns, 3.99/2.01/1.89 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 43m59s of round trip (command plus model time, ADR 0006 section 2): 82% of wall.

All runs: CI wait: 7m32s in `ci-poll.sh` calls; framework wall (wall less CI wait) 45m48s.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/8).
