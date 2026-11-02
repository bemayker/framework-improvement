# Run statistics, run

Generated 2026-11-02 22:17 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 3m45s | 11 | 27 | 2.7 | 6 | 17.9K | 80.5K | 101.7K | 0 | 0.881 | claude-fable-5-1 | 1/4/4 | 4.00/1.75/3.75 |  |
| 3.orchestrator (in 3) | Ingestion dispatch | 3m45s | 11 | 27 | 2.7 | 6 | 17.9K | 80.5K | 101.7K | 0 | 0.881 | claude-fable-5-1 | 1/4/4 | 4.00/1.75/3.75 |  |
| 5 | Scheduler loop | 45m13s | 532 | 1019 | 2.21 | 14 | 407.4K | 143.8K | 458.4K | 0 | 0.961 | claude-opus-5-5 | 88/60/272 | 4.02/2.32/1.69 |  |
| 3.orchestrator #2 (in 5) | Final re-ingest | 2m54s | 15 | 27 | 1.93 | 4 | 13.3K | 172.0K | 449.4K | 0 | 0.962 | claude-fable-5-1 | 2/2/7 | 3.00/3.00/1.71 |  |
| 8 | Final report | 2m56s | 8 | 10 | 1.43 | 3 | 17.5K | 262.1K | 472.5K | 0 | 0.971 | claude-fable-5-1 | 1/2/3 | 3.00/1.00/1.33 |  |
| **run total** |  | 51m54s | 551 | 1056 | 2.2 | 14 | 442.8K |  | 472.5K |  | 0.96 | claude-opus-5-5 | 90/66/279 (exec 78% of wall) | 4.01/2.24/1.71 |  |

Wall is this run's last step end minus its first step start; steps sum to 51m54s.

Nested sub-span(s) `3.orchestrator (in 3)`, `3.orchestrator #2 (in 5)` lie wholly inside the step each names: each row's figures are that sub-span's own and are inside its parent's row as well, so the run total and the steps sum leave them out.

Exec turns took 40m16s of round trip (command plus model time, ADR 0006 section 2): 78% of wall.

CI wait: 8m08s in `ci-poll.sh` calls; framework wall (wall less CI wait) 43m46s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a01fba20392823195 | mayker-dev:planner | deliver | 5 | 11 | 35 | 3.5 | 0/2/8 | n/a/1.50/4.00 | 16.3K | 97.6K | 120.7K | 0.888 | claude-opus-5-5 |  |
| agent-a040afa236c2d8d3d | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 1/1/4 | 7.00/1.00/1.25 | 6.3K | 55.4K | 64.2K | 0.834 | claude-fable-5-1 |  |
| agent-a13e4e1c2a718dec6 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 3.00/2.00/1.67 | 4.9K | 65.3K | 75.4K | 0.865 | claude-sonnet-5-5 |  |
| agent-a14391c776c2dcbf7 | mayker-dev:reviewer | deliver | 5 | 4 | 20 | 6.67 | 3/0/0 | 6.67/n/a/n/a | 6.9K | 54.7K | 76.0K | 0.698 | claude-opus-5-5 |  |
| agent-a1b70ead3202f7d16 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 5.8K | 53.8K | 59.4K | 0.857 | claude-fable-5-1 |  |
| agent-a1c1cad786628f8a3 | mayker-dev:orchestrator | deliver | 3 | 9 | 25 | 3.12 | 1/3/4 | 4.00/2.00/3.75 | 16.2K | 80.9K | 101.7K | 0.86 | claude-fable-5-1 |  |
| agent-a1c836cdb45c06300 | mayker-dev:orchestrator | deliver | 5 | 11 | 22 | 2.2 | 2/2/5 | 3.00/3.00/1.80 | 11.7K | 72.6K | 88.2K | 0.889 | claude-fable-5-1 |  |
| agent-a1d0aa80593d0e221 | mayker-dev:reviewer | deliver | 5 | 5 | 17 | 4.25 | 4/0/0 | 4.25/n/a/n/a | 7.0K | 54.6K | 67.5K | 0.752 | claude-opus-5-5 |  |
| agent-a1fb44e2b1c5eb12f | mayker-dev:builder | deliver | 5 | 5 | 4 | 1.0 | 1/0/3 | 1.00/n/a/1.00 | 1.0K | 40.3K | 43.0K | 0.856 | claude-sonnet-5-5 |  |
| agent-a31481df93c37cb63 | mayker-dev:builder | deliver | 5 | 8 | 15 | 2.14 | 2/1/4 | 5.00/1.00/1.00 | 3.5K | 54.4K | 61.8K | 0.89 | claude-sonnet-5-5 |  |
| agent-a32674b5a40f5d5eb | mayker-dev:builder | deliver | 5 | 8 | 17 | 2.43 | 2/3/2 | 2.50/3.00/1.50 | 6.6K | 56.3K | 67.0K | 0.882 | claude-sonnet-5-5 |  |
| agent-a4097e35d91452af3 | mayker-dev:builder | deliver | 5 | 9 | 31 | 3.88 | 2/3/3 | 6.50/4.67/1.33 | 9.2K | 70.7K | 80.9K | 0.873 | claude-sonnet-5-5 |  |
| agent-a40b5e0c1db7d15bf | mayker-dev:builder | deliver | 5 | 2 | 4 | 4.0 | 1/0/0 | 4.00/n/a/n/a | 1.2K | 39.4K | 43.6K | 0.624 | claude-sonnet-5-5 |  |
| agent-a4269a0a7c325e4ed | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 2/1/5 | 4.00/8.00/1.60 | 7.1K | 66.0K | 76.5K | 0.895 | claude-sonnet-5-5 |  |
| agent-a46193e6526317ae7 | mayker-dev:builder | deliver | 5 | 13 | 28 | 2.33 | 1/2/9 | 3.00/4.00/1.89 | 7.1K | 55.2K | 61.5K | 0.934 | claude-sonnet-5-5 |  |
| agent-a4bc270c64f149587 | mayker-dev:planner | deliver | 5 | 14 | 38 | 2.92 | 0/2/10 | n/a/1.50/2.80 | 18.9K | 96.8K | 117.4K | 0.923 | claude-opus-5-5 |  |
| agent-a5ebff6945a40a081 | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 2/1/5 | 2.00/3.00/1.60 | 7.4K | 57.4K | 65.2K | 0.901 | claude-sonnet-5-5 |  |
| agent-a62cd4b2bdd46b00d | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 2/2/4 | 3.00/2.00/1.25 | 7.3K | 60.3K | 68.9K | 0.899 | claude-sonnet-5-5 |  |
| agent-a6760008f2d481483 | mayker-dev:builder | deliver | 5 | 13 | 25 | 2.08 | 2/1/8 | 2.50/3.00/2.00 | 6.5K | 73.0K | 83.2K | 0.927 | claude-sonnet-5-5 |  |
| agent-a67755cd88b54425d | mayker-dev:builder | deliver | 5 | 6 | 21 | 4.2 | 2/1/2 | 5.50/7.00/1.50 | 8.5K | 70.5K | 83.8K | 0.835 | claude-sonnet-5-5 |  |
| agent-a71242b91e6114785 | mayker-dev:orchestrator | deliver | 5 | 9 | 19 | 2.38 | 3/1/4 | 3.00/1.00/2.25 | 8.0K | 59.4K | 69.3K | 0.895 | claude-fable-5-1 |  |
| agent-a756b76e750e97cb1 | mayker-dev:builder | deliver | 5 | 8 | 14 | 2.0 | 2/1/4 | 3.00/3.00/1.25 | 6.5K | 56.5K | 64.2K | 0.889 | claude-sonnet-5-5 |  |
| agent-a84549d76104ade8a | mayker-dev:builder | deliver | 5 | 5 | 7 | 1.75 | 1/0/3 | 2.00/n/a/1.67 | 2.3K | 40.0K | 42.6K | 0.856 | claude-sonnet-5-5 |  |
| agent-a848d30fcc39b3a3f | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 5.4K | 48.7K | 54.3K | 0.814 | claude-fable-5-1 |  |
| agent-a89ce5043212b57e4 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 3.2 | 2/1/2 | 5.00/2.00/2.00 | 5.7K | 61.8K | 69.8K | 0.848 | claude-fable-5-1 |  |
| agent-a8df06013471440c9 | mayker-dev:orchestrator | deliver | 8 | 4 | 6 | 2.0 | 1/0/2 | 3.00/n/a/1.50 | 8.2K | 54.6K | 61.0K | 0.79 | claude-fable-5-1 |  |
| agent-a9604fa6795b01d9b | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.67 | 1/2/3 | 6.00/3.50/1.00 | 5.2K | 63.2K | 69.9K | 0.842 | claude-sonnet-5-5 |  |
| agent-aa4b5547495c073e9 | mayker-dev:reviewer | deliver | 5 | 5 | 19 | 4.75 | 4/0/0 | 4.75/n/a/n/a | 5.9K | 55.4K | 67.4K | 0.792 | claude-opus-5-5 |  |
| agent-aa67f3cfa2f45c972 | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 2/1/3 | 6.00/1.00/1.33 | 3.9K | 59.8K | 67.6K | 0.872 | claude-sonnet-5-5 |  |
| agent-aa892d45cab5d864c | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 6.0K | 51.2K | 65.3K | 0.681 | claude-opus-5-5 |  |
| agent-aac02b2d7d9cbd3a3 | mayker-dev:builder | deliver | 5 | 3 | 6 | 3.0 | 1/0/1 | 3.00/n/a/3.00 | 1.3K | 43.4K | 48.1K | 0.738 | claude-sonnet-5-5 |  |
| agent-ab0fba0629a40acae | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.83 | 0/1/5 | n/a/1.00/2.00 | 3.1K | 45.4K | 49.9K | 0.887 | claude-sonnet-5-5 |  |
| agent-ab18e42324bc9eb1a | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.3K | 48.3K | 52.2K | 0.783 | claude-fable-5-1 |  |
| agent-ab29d579bc75b45f2 | mayker-dev:reviewer | deliver | 5 | 8 | 32 | 4.57 | 7/0/0 | 4.57/n/a/n/a | 9.9K | 63.8K | 78.3K | 0.866 | claude-opus-5-5 |  |
| agent-ab355ca157f08a92d | mayker-dev:builder | deliver | 5 | 9 | 25 | 3.12 | 3/2/3 | 3.67/5.50/1.00 | 8.3K | 66.1K | 81.0K | 0.887 | claude-sonnet-5-5 |  |
| agent-ab44e6a6175af5064 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 4.00/2.00/1.00 | 2.6K | 45.3K | 49.6K | 0.887 | claude-sonnet-5-5 |  |
| agent-ac2bde43c3b576d89 | mayker-dev:planner | deliver | 5 | 10 | 28 | 3.11 | 1/1/5 | 5.00/2.00/3.80 | 13.0K | 85.1K | 103.9K | 0.878 | claude-opus-5-5 |  |
| agent-ac386f94398769b2a | mayker-dev:orchestrator | deliver | 5 | 5 | 10 | 2.5 | 1/1/2 | 7.00/1.00/1.00 | 3.7K | 50.3K | 54.8K | 0.836 | claude-fable-5-1 |  |
| agent-ac9a5755d3d30569f | mayker-dev:planner | deliver | 5 | 13 | 33 | 2.75 | 1/1/9 | 1.00/2.00/2.67 | 13.9K | 89.9K | 110.5K | 0.917 | claude-opus-5-5 |  |
| agent-aca2e1649f10d28fd | mayker-dev:builder | deliver | 5 | 10 | 18 | 2.0 | 3/2/4 | 2.67/3.00/1.00 | 8.1K | 59.5K | 66.4K | 0.912 | claude-sonnet-5-5 |  |
| agent-ad5a73fefb1e25279 | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.5K | 48.6K | 52.7K | 0.838 | claude-fable-5-1 |  |
| agent-ae42c31d13caacd0a | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 2.50/2.00/1.25 | 5.5K | 54.8K | 62.0K | 0.89 | claude-sonnet-5-5 |  |
| agent-ae8873e56cec5c182 | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 2/1/3 | 4.50/1.00/3.33 | 6.6K | 57.6K | 64.8K | 0.873 | claude-fable-5-1 |  |
| agent-ae8d0690224f0a8cc | mayker-dev:planner | deliver | 5 | 14 | 34 | 2.62 | 3/1/9 | 4.00/2.00/2.22 | 16.4K | 93.1K | 116.4K | 0.921 | claude-opus-5-5 |  |
| agent-aeb71e2919184b067 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 5.2K | 50.3K | 54.9K | 0.863 | claude-fable-5-1 |  |
| agent-afe91f02cac6b091f | mayker-dev:builder | deliver | 5 | 12 | 19 | 1.73 | 1/1/8 | 4.00/3.00/1.38 | 4.7K | 68.8K | 76.8K | 0.924 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 67.2K, peak 120.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 42.6K, 43.0K, 43.6K, 48.1K, 49.6K, 49.9K, 52.2K, 52.7K, 54.3K, 54.8K, 54.9K, 59.4K, 61.0K, 61.5K, 61.8K, 62.0K, 64.2K, 64.2K, 64.8K, 65.2K, 65.3K, 66.4K, 67.0K, 67.4K, 67.5K, 67.6K, 68.9K, 69.3K, 69.8K, 69.9K, 75.4K, 76.0K, 76.5K, 76.8K, 78.3K, 80.9K, 81.0K, 83.2K, 83.8K, 88.2K, 101.7K, 103.9K, 110.5K, 116.4K, 117.4K, 120.7K.

**All runs:** 1 run(s), wall 51m54s (sum of per-run walls, idle time between runs excluded), 551 turns, 1056 tool calls, 442.8K output tokens, cache hit 0.96.

Turn classes across every bucket, read / edit / exec: 90/66/279 turns, 4.01/2.24/1.71 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 40m16s of round trip (command plus model time, ADR 0006 section 2): 78% of wall.

All runs: CI wait: 8m08s in `ci-poll.sh` calls; framework wall (wall less CI wait) 43m46s.

13 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 3/0/9).
