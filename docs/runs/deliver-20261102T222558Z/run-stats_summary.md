# Run statistics, run

Generated 2026-11-02 23:18 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 47 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 3m14s | 11 | 22 | 2.2 | 4 | 17.4K | 82.3K | 104.3K | 0 | 0.864 | claude-fable-5-1 | 1/3/5 | 4.00/2.33/2.00 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 3m14s | 11 | 22 | 2.2 | 4 | 17.4K | 82.3K | 104.3K | 0 | 0.864 | claude-fable-5-1 | 1/3/5 | 4.00/2.33/2.00 |  |
| 5 | Scheduler loop | 45m51s | 591 | 1157 | 2.23 | 16 | 440.0K | 147.7K | 474.2K | 0 | 0.963 | claude-opus-5-5 | 78/94/307 | 4.50/2.20/1.75 |  |
| 3.orchestrator #2 (in 5) | Re-ingest at wave-2 boundary | 25m53s | 277 | 512 | 2.14 | 11 | 204.9K | 179.9K | 474.2K | 1 | 0.97 | claude-opus-5-5 | 37/48/138 | 3.84/1.90/1.86 |  |
| 8 | Final report | 2m53s | 8 | 12 | 1.71 | 6 | 17.3K | 269.4K | 487.8K | 0 | 0.97 | claude-fable-5-1 | 2/1/3 | 3.50/1.00/1.00 |  |
| **run total** |  | 51m58s | 610 | 1191 | 2.22 | 16 | 474.8K |  | 487.8K |  | 0.962 | claude-opus-5-5 | 81/98/315 (exec 77% of wall) | 4.47/2.19/1.74 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m58s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 40m14s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

CI wait: 6m28s in `ci-poll.sh` calls; framework wall (wall less CI wait) 45m29s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0a288daaf6ea7ec2 | mayker-dev:builder | deliver | 5 | 15 | 33 | 2.36 | 1/2/11 | 5.00/2.00/2.18 | 7.0K | 76.4K | 84.2K | 0.939 | claude-sonnet-5-5 |  |
| agent-a0aabd5fe59673468 | mayker-dev:planner | deliver | 5 | 13 | 33 | 2.75 | 0/1/10 | n/a/2.00/2.60 | 17.4K | 92.8K | 119.1K | 0.913 | claude-opus-5-5 |  |
| agent-a0bf01da7ed626d64 | mayker-dev:builder | deliver | 5 | 15 | 33 | 2.36 | 2/1/10 | 2.50/3.00/2.40 | 8.0K | 78.4K | 90.0K | 0.935 | claude-sonnet-5-5 |  |
| agent-a144bc2772c4d78c8 | mayker-dev:orchestrator | deliver | 5 | 15 | 26 | 1.86 | 1/4/9 | 4.00/1.50/1.78 | 17.7K | 88.9K | 106.2K | 0.93 | claude-fable-5-1 |  |
| agent-a178ee9a3083335df | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 4.8K | 48.9K | 54.1K | 0.861 | claude-fable-5-1 |  |
| agent-a1ba3f38b8dba4f26 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 1/1/3 | 5.00/1.00/1.33 | 3.6K | 48.6K | 53.4K | 0.863 | claude-fable-5-1 |  |
| agent-a1ddbcaf60f45ebe2 | mayker-dev:reviewer | deliver | 5 | 6 | 18 | 3.6 | 5/0/0 | 3.60/n/a/n/a | 5.8K | 55.3K | 65.5K | 0.803 | claude-opus-5-5 |  |
| agent-a1e7b383a9a3f2816 | mayker-dev:builder | deliver | 5 | 4 | 7 | 2.33 | 1/0/2 | 2.00/n/a/2.50 | 2.1K | 49.4K | 63.8K | 0.747 | claude-sonnet-5-5 |  |
| agent-a2b45dd0956468b47 | mayker-dev:planner | deliver | 5 | 12 | 31 | 2.82 | 1/3/7 | 6.00/1.00/3.14 | 11.5K | 88.2K | 104.4K | 0.914 | claude-opus-5-5 |  |
| agent-a2d2edcad4ba77985 | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 1/2/2 | 8.00/3.00/1.00 | 5.5K | 68.7K | 78.3K | 0.81 | claude-sonnet-5-5 |  |
| agent-a2e06ae438c77d2f5 | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 1/1/4 | 7.00/1.00/1.00 | 4.6K | 49.7K | 54.6K | 0.843 | claude-fable-5-1 |  |
| agent-a42e5b27ec405c500 | mayker-dev:builder | deliver | 5 | 14 | 31 | 2.38 | 2/1/9 | 2.50/5.00/2.22 | 6.6K | 69.2K | 79.3K | 0.933 | claude-sonnet-5-5 |  |
| agent-a49e7c197b457abfb | mayker-dev:builder | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 6.50/1.00/1.00 | 3.4K | 56.3K | 63.7K | 0.853 | claude-sonnet-5-5 |  |
| agent-a4e75911ee11a26a1 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/1/3 | 3.00/9.00/2.00 | 5.9K | 64.3K | 74.5K | 0.834 | claude-sonnet-5-5 |  |
| agent-a564d2b1575f479e5 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 8.00/1.00/2.00 | 5.8K | 54.8K | 60.8K | 0.856 | claude-fable-5-1 |  |
| agent-a5e1e3dff8e7be04a | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 4.00/2.00/2.00 | 6.1K | 49.9K | 55.9K | 0.858 | claude-fable-5-1 |  |
| agent-a63a4077410494173 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 3.6K | 47.2K | 52.8K | 0.813 | claude-fable-5-1 |  |
| agent-a6a1c6a1952095b2a | mayker-dev:orchestrator | deliver | 8 | 4 | 8 | 2.67 | 2/0/1 | 3.50/n/a/1.00 | 8.6K | 58.9K | 66.8K | 0.78 | claude-fable-5-1 |  |
| agent-a6d8ee094b9940f18 | mayker-dev:planner | deliver | 5 | 13 | 40 | 3.33 | 1/2/8 | 6.00/2.00/2.75 | 21.3K | 99.8K | 130.2K | 0.91 | claude-opus-5-5 |  |
| agent-a6e59cfb493d1d43c | mayker-dev:builder | deliver | 5 | 12 | 21 | 1.91 | 1/1/8 | 4.00/3.00/1.62 | 5.4K | 66.5K | 73.6K | 0.925 | claude-sonnet-5-5 |  |
| agent-a6f5956620f16f826 | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/2/2 | 6.00/3.50/1.50 | 8.7K | 73.1K | 85.6K | 0.86 | claude-sonnet-5-5 |  |
| agent-a8136ec4853bc908c | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 0/1/3 | n/a/1.00/2.67 | 2.4K | 51.5K | 57.1K | 0.832 | claude-sonnet-5-5 |  |
| agent-a8425711bfe61dcd0 | mayker-dev:reviewer | deliver | 5 | 5 | 21 | 5.25 | 4/0/0 | 5.25/n/a/n/a | 7.2K | 57.4K | 71.7K | 0.785 | claude-opus-5-5 |  |
| agent-a84bac24141650fd2 | mayker-dev:builder | deliver | 5 | 10 | 18 | 2.0 | 2/2/5 | 3.50/3.00/1.00 | 7.3K | 59.5K | 65.6K | 0.913 | claude-sonnet-5-5 |  |
| agent-a8660bfc15ecdf0d4 | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 2.00/1.50/1.20 | 7.2K | 55.7K | 62.7K | 0.912 | claude-sonnet-5-5 |  |
| agent-a91cb62457d5ccdc8 | mayker-dev:reviewer | deliver | 5 | 3 | 18 | 9.0 | 2/0/0 | 9.00/n/a/n/a | 5.4K | 46.7K | 63.9K | 0.544 | claude-opus-5-5 |  |
| agent-a9a81c7c1edf9e73d | mayker-dev:planner | deliver | 5 | 14 | 34 | 2.62 | 3/3/7 | 4.33/1.67/2.29 | 12.6K | 105.4K | 121.0K | 0.918 | claude-opus-5-5 |  |
| agent-a9f9a2c29b8c98688 | mayker-dev:builder | deliver | 5 | 13 | 17 | 1.42 | 2/1/9 | 2.00/2.00/1.22 | 7.2K | 49.5K | 56.5K | 0.934 | claude-sonnet-5-5 |  |
| agent-aa123733513bbe97e | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 4.00/2.00/1.67 | 4.1K | 49.2K | 55.1K | 0.813 | claude-fable-5-1 |  |
| agent-aa3dd81511f716cd0 | mayker-dev:reviewer | deliver | 5 | 4 | 22 | 7.33 | 3/0/0 | 7.33/n/a/n/a | 6.3K | 55.9K | 74.3K | 0.712 | claude-opus-5-5 |  |
| agent-aa5596e08953f2421 | mayker-dev:builder | deliver | 5 | 8 | 22 | 3.14 | 3/2/2 | 3.33/5.00/1.00 | 7.6K | 56.6K | 68.2K | 0.88 | claude-sonnet-5-5 |  |
| agent-aa5d11eb2a4721a3d | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 3.00/1.00/2.50 | 2.4K | 51.3K | 58.5K | 0.826 | claude-sonnet-5-5 |  |
| agent-aaa44b01fb281eb20 | mayker-dev:builder | deliver | 5 | 10 | 26 | 2.89 | 1/4/4 | 4.00/2.00/3.50 | 8.6K | 63.1K | 71.8K | 0.908 | claude-sonnet-5-5 |  |
| agent-ab879226a2a1b0e9f | mayker-dev:builder | deliver | 5 | 6 | 18 | 3.6 | 2/2/1 | 5.00/3.50/1.00 | 5.2K | 53.6K | 60.0K | 0.857 | claude-sonnet-5-5 |  |
| agent-abc72d5761a47ca17 | mayker-dev:builder | deliver | 5 | 9 | 13 | 1.62 | 2/3/3 | 2.00/1.67/1.33 | 5.9K | 54.4K | 61.2K | 0.903 | claude-sonnet-5-5 |  |
| agent-abdd11fd7d6c50176 | mayker-dev:orchestrator | deliver | 5 | 6 | 15 | 3.0 | 1/1/3 | 7.00/2.00/2.00 | 5.4K | 52.5K | 58.5K | 0.857 | claude-fable-5-1 |  |
| agent-ac287425ce13ab156 | mayker-dev:builder | deliver | 5 | 19 | 36 | 2.0 | 1/4/12 | 4.00/2.25/1.83 | 9.4K | 77.0K | 88.4K | 0.949 | claude-sonnet-5-5 |  |
| agent-ac8bb559ef9fbeaa4 | mayker-dev:orchestrator | deliver | 5 | 7 | 19 | 3.17 | 2/1/3 | 5.00/1.00/2.67 | 6.5K | 57.9K | 64.8K | 0.873 | claude-fable-5-1 |  |
| agent-ac9600852bd3326fb | mayker-dev:orchestrator | deliver | 5 | 10 | 22 | 2.44 | 1/2/6 | 4.00/2.50/2.17 | 10.9K | 82.7K | 100.7K | 0.878 | claude-fable-5-1 |  |
| agent-ad367f519933edd8c | mayker-dev:builder | deliver | 5 | 5 | 8 | 2.0 | 0/0/4 | n/a/n/a/2.00 | 2.0K | 49.0K | 59.1K | 0.815 | claude-sonnet-5-5 |  |
| agent-ad5ad22ddfd7bdb38 | mayker-dev:orchestrator | deliver | 3 | 8 | 18 | 2.57 | 1/2/4 | 4.00/2.50/2.25 | 14.2K | 81.6K | 104.3K | 0.84 | claude-fable-5-1 |  |
| agent-ae02230f5d2b91d25 | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 0/0/4 | n/a/n/a/1.75 | 1.5K | 47.2K | 52.8K | 0.835 | claude-sonnet-5-5 |  |
| agent-ae075326226d68ef2 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.50/2.00/1.00 | 5.2K | 53.0K | 59.0K | 0.894 | claude-sonnet-5-5 |  |
| agent-ae7fe38a7bc0e27a1 | mayker-dev:orchestrator | deliver | 5 | 8 | 12 | 1.71 | 1/2/4 | 4.00/1.00/1.50 | 5.6K | 52.3K | 58.7K | 0.892 | claude-fable-5-1 |  |
| agent-ae8766a22cc0a0631 | mayker-dev:builder | deliver | 5 | 10 | 39 | 4.33 | 2/2/5 | 7.50/9.00/1.20 | 10.7K | 75.4K | 85.4K | 0.905 | claude-sonnet-5-5 |  |
| agent-af148cfa76e30f508 | mayker-dev:planner | deliver | 5 | 12 | 33 | 3.0 | 1/1/9 | 11.00/2.00/2.22 | 15.9K | 99.4K | 124.5K | 0.896 | claude-opus-5-5 |  |
| agent-af382ff7e03799bcf | mayker-dev:reviewer | deliver | 5 | 5 | 29 | 7.25 | 4/0/0 | 7.25/n/a/n/a | 8.1K | 59.7K | 75.9K | 0.779 | claude-opus-5-5 |  |

**47 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 14, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 65.6K, peak 130.2K, 0 above the auto threshold (80% of the serving model's window). Distribution: 52.8K, 52.8K, 53.4K, 54.1K, 54.6K, 55.1K, 55.9K, 56.5K, 57.1K, 58.5K, 58.5K, 58.7K, 59.0K, 59.1K, 60.0K, 60.8K, 61.2K, 62.7K, 63.7K, 63.8K, 63.9K, 64.8K, 65.5K, 65.6K, 66.8K, 68.2K, 71.7K, 71.8K, 73.6K, 74.3K, 74.5K, 75.9K, 78.3K, 79.3K, 84.2K, 85.4K, 85.6K, 88.4K, 90.0K, 100.7K, 104.3K, 104.4K, 106.2K, 119.1K, 121.0K, 124.5K, 130.2K.

**All runs:** 1 run(s), wall 51m58s (sum of per-run walls, idle time between runs excluded), 610 turns, 1191 tool calls, 474.8K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 81/98/315 turns, 4.47/2.19/1.74 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 40m14s of round trip (command plus model time, ADR 0006 section 2): 77% of wall.

All runs: CI wait: 6m28s in `ci-poll.sh` calls; framework wall (wall less CI wait) 45m29s.

12 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/9).
