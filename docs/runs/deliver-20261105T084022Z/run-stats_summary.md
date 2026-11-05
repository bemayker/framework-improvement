# Run statistics, run

Generated 2026-11-05 09:32 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 48 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 52m12s | 559 | 1094 | 2.27 | 14 | 429.2K |  | 461.8K |  | 0.958 | claude-opus-5-5 | 91/67/280 (exec 72% of wall) | 4.14/2.28/1.74 |  |

Wall is this run's last step end minus its first step start; steps sum to 52m12s.

Exec turns took 37m28s of round trip (command plus model time, ADR 0006 section 2): 72% of wall.

CI wait: 10m38s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m33s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a05d12ae3c7989074 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 1/2/3 | 3.00/4.50/2.67 | 6.8K | 59.2K | 68.6K | 0.866 | claude-sonnet-5-5 |  |
| agent-a1783e78c9decc128 | mayker-dev:planner | deliver | 5 | 13 | 34 | 2.83 | 2/1/9 | 1.50/2.00/3.22 | 13.1K | 74.6K | 93.6K | 0.917 | claude-opus-5-5 |  |
| agent-a1c61058e08db056e | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 1/0/2 | 1.00/n/a/2.50 | 1.2K | 46.9K | 61.3K | 0.743 | claude-sonnet-5-5 |  |
| agent-a257c01cc9e33315c | mayker-dev:planner | deliver | 5 | 8 | 16 | 2.29 | 2/1/2 | 4.00/2.00/2.00 | 10.9K | 59.5K | 71.6K | 0.877 | claude-opus-5-5 |  |
| agent-a31af058638fc4ac3 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 3/1/2 | 3.33/1.00/1.00 | 4.0K | 49.1K | 55.2K | 0.876 | claude-fable-5-1 |  |
| agent-a3379b59e85c57076 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.4K | 49.5K | 62.0K | 0.734 | claude-opus-5-5 |  |
| agent-a39299b663f1c9eac | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 4.50/3.00/1.00 | 4.6K | 54.9K | 62.1K | 0.851 | claude-sonnet-5-5 |  |
| agent-a3a551a4072a44c05 | mayker-dev:reviewer | deliver | 5 | 5 | 26 | 6.5 | 4/0/0 | 6.50/n/a/n/a | 9.2K | 59.7K | 75.4K | 0.778 | claude-opus-5-5 |  |
| agent-a52c8660e062c6ccc | mayker-dev:orchestrator | deliver | 5 | 9 | 20 | 2.5 | 1/3/4 | 4.00/2.00/2.50 | 11.7K | 79.8K | 100.9K | 0.859 | claude-fable-5-1 |  |
| agent-a530e0bdc14c0aa75 | mayker-dev:builder | deliver | 5 | 8 | 22 | 3.14 | 2/2/3 | 4.00/5.50/1.00 | 7.4K | 59.9K | 69.0K | 0.883 | claude-sonnet-5-5 |  |
| agent-a56eef2770817cd39 | mayker-dev:planner | deliver | 5 | 11 | 39 | 3.9 | 1/2/6 | 8.00/1.50/3.67 | 18.9K | 93.1K | 116.6K | 0.899 | claude-opus-5-5 |  |
| agent-a5a3424e17dabf990 | mayker-dev:orchestrator | deliver | 3 | 9 | 23 | 2.88 | 2/2/4 | 2.50/2.00/3.50 | 15.7K | 97.2K | 126.0K | 0.856 | claude-fable-5-1 |  |
| agent-a5df6f1d33b48f74f | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 5.1K | 46.9K | 64.2K | 0.543 | claude-opus-5-5 |  |
| agent-a604a65a45ea76489 | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 8.00/1.00/1.33 | 5.9K | 50.6K | 55.9K | 0.857 | claude-fable-5-1 |  |
| agent-a60ed5f36dec1c066 | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 5.1K | 44.7K | 59.8K | 0.554 | claude-opus-5-5 |  |
| agent-a61f13edb9e47ff2c | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/1/4 | 2.00/3.00/1.50 | 4.4K | 52.3K | 58.7K | 0.891 | claude-sonnet-5-5 |  |
| agent-a65e735cc41f1a3de | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 3/1/4 | 1.67/2.00/1.25 | 5.1K | 53.7K | 60.0K | 0.903 | claude-sonnet-5-5 |  |
| agent-a68546d9eb461ac04 | mayker-dev:builder | deliver | 5 | 3 | 3 | 1.5 | 0/0/2 | n/a/n/a/1.50 | 709 | 36.3K | 37.6K | 0.774 | claude-sonnet-5-5 |  |
| agent-a6ba6dda2352ea9f9 | mayker-dev:builder | deliver | 5 | 5 | 12 | 3.0 | 2/1/1 | 5.00/1.00/1.00 | 2.5K | 52.0K | 58.7K | 0.824 | claude-sonnet-5-5 |  |
| agent-a72fb2346939603d8 | mayker-dev:builder | deliver | 5 | 6 | 28 | 5.6 | 2/1/2 | 6.50/13.00/1.00 | 8.3K | 60.3K | 72.2K | 0.836 | claude-sonnet-5-5 |  |
| agent-a7f2dcf0d65356ddb | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 6.0K | 52.2K | 67.9K | 0.675 | claude-opus-5-5 |  |
| agent-a7f7ea60a4d92744b | mayker-dev:builder | deliver | 5 | 15 | 24 | 1.71 | 1/1/11 | 4.00/2.00/1.55 | 6.3K | 64.6K | 72.2K | 0.939 | claude-sonnet-5-5 |  |
| agent-a841765a51ce07c1a | mayker-dev:planner | deliver | 5 | 18 | 40 | 2.35 | 3/1/12 | 2.00/2.00/1.67 | 17.5K | 81.0K | 100.4K | 0.931 | claude-opus-5-5 |  |
| agent-a841bbe76a4e491a7 | mayker-dev:builder | deliver | 5 | 11 | 17 | 1.7 | 1/1/7 | 4.00/4.00/1.14 | 3.9K | 58.9K | 63.7K | 0.922 | claude-sonnet-5-5 |  |
| agent-a89192d29582cff33 | mayker-dev:orchestrator | deliver | 5 | 7 | 12 | 2.0 | 3/1/2 | 3.00/1.00/1.00 | 3.7K | 51.8K | 58.1K | 0.874 | claude-fable-5-1 |  |
| agent-a95808c8a5b9903d6 | mayker-dev:builder | deliver | 5 | 2 | 2 | 2.0 | 0/0/1 | n/a/n/a/2.00 | 584 | 36.2K | 38.3K | 0.65 | claude-sonnet-5-5 |  |
| agent-a9cab5450311d0b51 | mayker-dev:orchestrator | deliver | 5 | 7 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 4.7K | 49.8K | 55.1K | 0.842 | claude-fable-5-1 |  |
| agent-a9d8370e460ef7fa3 | mayker-dev:orchestrator | deliver | 5 | 7 | 19 | 3.17 | 2/1/3 | 5.50/1.00/2.33 | 9.1K | 66.6K | 76.8K | 0.862 | claude-fable-5-1 |  |
| agent-a9f8732001cd0eccc | mayker-dev:orchestrator | deliver | 5 | 9 | 20 | 2.5 | 2/1/5 | 5.00/1.00/1.80 | 10.2K | 56.6K | 65.3K | 0.896 | claude-fable-5-1 |  |
| agent-aa337a7d4b3a53d1f | mayker-dev:builder | deliver | 5 | 3 | 6 | 3.0 | 0/0/2 | n/a/n/a/3.00 | 1.3K | 38.0K | 41.0K | 0.754 | claude-sonnet-5-5 |  |
| agent-aa3931bbfd56f93cb | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.00/2.00/1.25 | 4.8K | 52.8K | 59.5K | 0.89 | claude-sonnet-5-5 |  |
| agent-aa6a1b3548315ac75 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 8.00/1.00/1.75 | 6.2K | 50.1K | 55.8K | 0.841 | claude-fable-5-1 |  |
| agent-aaf1c5cdd652b5648 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 4.00/1.00/1.00 | 4.2K | 52.8K | 58.7K | 0.814 | claude-fable-5-1 |  |
| agent-ab045969e331514aa | mayker-dev:orchestrator | deliver | 8 | 4 | 8 | 2.67 | 1/0/2 | 1.00/n/a/3.50 | 9.6K | 56.1K | 65.4K | 0.772 | claude-fable-5-1 |  |
| agent-ab5bb09aefbd798fc | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/1/3 | 3.50/9.00/2.00 | 6.6K | 58.6K | 68.5K | 0.833 | claude-sonnet-5-5 |  |
| agent-ab6aae281b0f0a40c | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 45.6K | 55.8K | 0.765 | claude-sonnet-5-5 |  |
| agent-abaf849f55a8061aa | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 2/2/4 | 2.50/2.00/1.50 | 6.4K | 55.0K | 62.4K | 0.9 | claude-sonnet-5-5 |  |
| agent-ac8ea17ec6d079fe0 | mayker-dev:builder | deliver | 5 | 7 | 18 | 3.0 | 2/1/3 | 6.00/2.00/1.33 | 3.9K | 59.5K | 66.5K | 0.871 | claude-sonnet-5-5 |  |
| agent-ac9c42ea95e2cf0bd | mayker-dev:builder | deliver | 5 | 7 | 15 | 2.5 | 2/2/2 | 3.00/3.50/1.00 | 5.0K | 57.8K | 65.5K | 0.838 | claude-sonnet-5-5 |  |
| agent-ad2228592a1f4f58e | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/2/1 | 5.00/1.50/1.00 | 2.8K | 51.7K | 56.9K | 0.858 | claude-sonnet-5-5 |  |
| agent-ad3d7e93cd0b01837 | mayker-dev:builder | deliver | 5 | 7 | 20 | 3.33 | 2/1/3 | 6.50/4.00/1.00 | 5.7K | 56.1K | 62.0K | 0.875 | claude-sonnet-5-5 |  |
| agent-ad6a34ebe846af772 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 4.00/1.00/1.67 | 6.0K | 50.7K | 56.1K | 0.877 | claude-fable-5-1 |  |
| agent-ad718879a996fe2dc | mayker-dev:planner | deliver | 5 | 13 | 33 | 2.75 | 1/3/7 | 3.00/1.33/3.14 | 12.3K | 82.6K | 98.7K | 0.908 | claude-opus-5-5 |  |
| agent-ad86dee9fc4c7101d | mayker-dev:orchestrator | deliver | 5 | 5 | 9 | 2.25 | 1/1/2 | 6.00/1.00/1.00 | 3.1K | 47.3K | 51.2K | 0.837 | claude-fable-5-1 |  |
| agent-adced5529789d1b07 | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 2.50/1.50/1.20 | 5.3K | 55.3K | 61.3K | 0.913 | claude-sonnet-5-5 |  |
| agent-af87a15fe3aec73ed | mayker-dev:planner | deliver | 5 | 16 | 35 | 2.33 | 2/3/9 | 4.00/1.33/2.00 | 17.0K | 76.2K | 94.7K | 0.933 | claude-opus-5-5 |  |
| agent-afc6fe2271990852b | mayker-dev:orchestrator | deliver | 5 | 7 | 20 | 3.33 | 2/1/3 | 5.00/1.00/3.00 | 6.2K | 58.5K | 65.9K | 0.87 | claude-fable-5-1 |  |
| agent-afecfddf980d7ee0a | mayker-dev:builder | deliver | 5 | 13 | 25 | 2.08 | 2/1/8 | 4.00/2.00/1.75 | 5.8K | 62.6K | 70.3K | 0.93 | claude-sonnet-5-5 |  |

**48 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 14, mayker-dev:planner 6, mayker-dev:reviewer 5): median ctx max 63.0K, peak 126.0K, 0 above the auto threshold (80% of the serving model's window). Distribution: 37.6K, 38.3K, 41.0K, 51.2K, 55.1K, 55.2K, 55.8K, 55.8K, 55.9K, 56.1K, 56.9K, 58.1K, 58.7K, 58.7K, 58.7K, 59.5K, 59.8K, 60.0K, 61.3K, 61.3K, 62.0K, 62.0K, 62.1K, 62.4K, 63.7K, 64.2K, 65.3K, 65.4K, 65.5K, 65.9K, 66.5K, 67.9K, 68.5K, 68.6K, 69.0K, 70.3K, 71.6K, 72.2K, 72.2K, 75.4K, 76.8K, 93.6K, 94.7K, 98.7K, 100.4K, 100.9K, 116.6K, 126.0K.

**All runs:** 1 run(s), wall 52m12s (sum of per-run walls, idle time between runs excluded), 559 turns, 1094 tool calls, 429.2K output tokens, cache hit 0.958.

Turn classes across every bucket, read / edit / exec: 91/67/280 turns, 4.14/2.28/1.74 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 37m28s of round trip (command plus model time, ADR 0006 section 2): 72% of wall.

All runs: CI wait: 10m38s in `ci-poll.sh` calls; framework wall (wall less CI wait) 41m33s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
