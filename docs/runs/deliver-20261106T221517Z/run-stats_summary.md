# Run statistics, run

Generated 2026-11-06 23:11 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 56m33s | 540 | 1143 | 2.43 | 15 | 463.5K |  | 494.9K |  | 0.957 | claude-opus-5-5 | 96/77/263 (exec 75% of wall) | 4.28/2.49/1.82 |  |

Wall is this run's last step end minus its first step start; steps sum to 56m33s.

Exec turns took 42m22s of round trip (command plus model time, ADR 0006 section 2): 75% of wall.

CI wait: 14m32s in `ci-poll.sh` calls; framework wall (wall less CI wait) 42m01s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0e3a529ab9fea26e | mayker-dev:reviewer | deliver | 5 | 3 | 19 | 9.5 | 2/0/0 | 9.50/n/a/n/a | 5.1K | 47.3K | 65.3K | 0.54 | claude-opus-5-5 |  |
| agent-a0ee9206ebf6b699b | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/2/2 | 4.00/3.50/2.50 | 10.1K | 74.6K | 95.3K | 0.817 | claude-fable-5-1 |  |
| agent-a113ba33d07beed3e | mayker-dev:reviewer | deliver | 5 | 3 | 17 | 8.5 | 2/0/0 | 8.50/n/a/n/a | 4.9K | 44.9K | 59.1K | 0.63 | claude-opus-5-5 |  |
| agent-a139da940e28e6122 | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/1/3 | 3.00/5.00/1.00 | 5.9K | 56.7K | 63.3K | 0.873 | claude-sonnet-5-5 |  |
| agent-a150d8301f4213f75 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.00/2.00/1.00 | 3.4K | 60.8K | 68.9K | 0.847 | claude-sonnet-5-5 |  |
| agent-a16110250304cba52 | mayker-dev:builder | deliver | 5 | 20 | 35 | 1.84 | 3/1/14 | 2.00/1.00/1.93 | 7.6K | 63.2K | 70.0K | 0.955 | claude-sonnet-5-5 |  |
| agent-a182b1887bec6ee54 | mayker-dev:builder | deliver | 5 | 8 | 21 | 3.0 | 2/2/3 | 7.50/1.50/1.00 | 4.4K | 63.5K | 71.2K | 0.885 | claude-sonnet-5-5 |  |
| agent-a1fde1b6c8d9cf042 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.50/2.00/1.00 | 5.2K | 52.5K | 58.7K | 0.891 | claude-sonnet-5-5 |  |
| agent-a2a936f794c3e6d16 | mayker-dev:orchestrator | deliver | 8 | 8 | 9 | 1.5 | 4/0/2 | 1.50/n/a/1.50 | 16.5K | 62.2K | 75.1K | 0.878 | claude-fable-5-1 |  |
| agent-a2d300829580cda2c | mayker-dev:reviewer | deliver | 5 | 3 | 13 | 6.5 | 2/0/0 | 6.50/n/a/n/a | 4.7K | 45.3K | 61.0K | 0.551 | claude-opus-5-5 |  |
| agent-a3714069992235c73 | mayker-dev:planner | deliver | 5 | 10 | 28 | 3.11 | 2/1/6 | 4.00/2.00/3.00 | 12.1K | 80.0K | 100.5K | 0.891 | claude-opus-5-5 |  |
| agent-a386a30bd2e7d2aae | mayker-dev:orchestrator | deliver | 5 | 6 | 14 | 2.8 | 1/1/3 | 8.00/1.00/1.67 | 7.7K | 58.9K | 69.7K | 0.838 | claude-fable-5-1 |  |
| agent-a3a595c2b8df1398d | mayker-dev:planner | deliver | 5 | 12 | 38 | 3.45 | 2/1/7 | 5.50/2.00/2.86 | 16.0K | 82.4K | 110.9K | 0.888 | claude-opus-5-5 |  |
| agent-a4fead4161dad2618 | mayker-dev:reviewer | deliver | 5 | 6 | 27 | 5.4 | 5/0/0 | 5.40/n/a/n/a | 8.7K | 60.5K | 74.8K | 0.819 | claude-opus-5-5 |  |
| agent-a57489407fadb74da | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/2/2 | 7.00/3.00/1.00 | 5.3K | 61.7K | 69.2K | 0.87 | claude-sonnet-5-5 |  |
| agent-a5ef83269d3ff163f | mayker-dev:planner | deliver | 5 | 14 | 45 | 3.46 | 1/3/8 | 4.00/1.33/2.88 | 26.0K | 97.1K | 129.7K | 0.914 | claude-opus-5-5 |  |
| agent-a5f53dbf671fac80c | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 8.00/1.00/1.25 | 9.5K | 62.6K | 70.9K | 0.867 | claude-fable-5-1 |  |
| agent-a64676b276271dcc8 | mayker-dev:builder | deliver | 5 | 9 | 16 | 2.0 | 2/1/5 | 3.00/2.00/1.60 | 4.8K | 60.0K | 66.9K | 0.9 | claude-sonnet-5-5 |  |
| agent-a66b047c4167f2948 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 4.00/2.00/2.00 | 4.1K | 52.7K | 60.1K | 0.81 | claude-fable-5-1 |  |
| agent-a6799ba660442a45b | mayker-dev:builder | deliver | 5 | 3 | 6 | 3.0 | 1/0/1 | 4.00/n/a/2.00 | 1.1K | 47.8K | 56.1K | 0.699 | claude-sonnet-5-5 |  |
| agent-a6f6f50c18ebaf82a | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 2/1/4 | 4.50/1.00/2.00 | 6.7K | 57.2K | 64.6K | 0.886 | claude-fable-5-1 |  |
| agent-a77381e9fb1d0214c | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 2/0/0 | 2.50/n/a/n/a | 1.0K | 47.0K | 61.9K | 0.654 | claude-sonnet-5-5 |  |
| agent-a789a1a03a32c247e | mayker-dev:builder | deliver | 5 | 12 | 22 | 2.0 | 2/1/7 | 2.50/4.00/1.71 | 5.8K | 62.5K | 68.6K | 0.926 | claude-sonnet-5-5 |  |
| agent-a7b176710c5642fa8 | mayker-dev:builder | deliver | 5 | 6 | 28 | 5.6 | 2/1/2 | 6.50/13.00/1.00 | 8.1K | 61.6K | 72.0K | 0.805 | claude-sonnet-5-5 |  |
| agent-a7ef053dd6fe2e8c2 | mayker-dev:builder | deliver | 5 | 10 | 20 | 2.22 | 2/1/6 | 3.50/3.00/1.67 | 4.9K | 61.0K | 70.5K | 0.906 | claude-sonnet-5-5 |  |
| agent-a81ea66ee0a16e4a8 | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.00/2.00/1.00 | 4.1K | 50.0K | 57.7K | 0.85 | claude-fable-5-1 |  |
| agent-a8b875087067ec6a1 | mayker-dev:orchestrator | deliver | 3 | 9 | 25 | 3.57 | 1/2/4 | 4.00/2.00/4.25 | 16.4K | 94.7K | 119.4K | 0.86 | claude-fable-5-1 |  |
| agent-a9323fa725b0839a0 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 3/1/2 | 2.67/1.00/1.00 | 4.1K | 51.5K | 59.0K | 0.871 | claude-fable-5-1 |  |
| agent-a9801d2ff9f8e2045 | mayker-dev:planner | deliver | 5 | 10 | 31 | 3.44 | 2/1/6 | 3.50/2.00/3.67 | 13.3K | 75.5K | 92.3K | 0.878 | claude-opus-5-5 |  |
| agent-a98142fbffe02984e | mayker-dev:reviewer | deliver | 5 | 4 | 24 | 8.0 | 3/0/0 | 8.00/n/a/n/a | 6.0K | 54.9K | 71.7K | 0.716 | claude-opus-5-5 |  |
| agent-a9c7748758fbb70a2 | mayker-dev:builder | deliver | 5 | 6 | 14 | 2.8 | 2/1/2 | 5.00/2.00/1.00 | 3.1K | 52.1K | 57.1K | 0.859 | claude-sonnet-5-5 |  |
| agent-aa17216acca7a5dcf | mayker-dev:builder | deliver | 5 | 10 | 14 | 1.56 | 2/2/5 | 3.00/1.50/1.00 | 6.1K | 56.5K | 62.4K | 0.913 | claude-sonnet-5-5 |  |
| agent-aa7bc6fcfc9b4d113 | mayker-dev:orchestrator | deliver | 5 | 8 | 14 | 2.33 | 3/1/2 | 3.67/1.00/1.00 | 5.5K | 54.1K | 62.4K | 0.855 | claude-fable-5-1 |  |
| agent-ab9e0683c373470f4 | mayker-dev:builder | deliver | 5 | 9 | 24 | 3.0 | 3/2/3 | 3.67/4.50/1.33 | 8.4K | 68.6K | 77.7K | 0.895 | claude-sonnet-5-5 |  |
| agent-ac79ec8376dc88645 | mayker-dev:builder | deliver | 5 | 8 | 12 | 1.71 | 2/1/4 | 3.00/2.00/1.00 | 5.3K | 55.1K | 61.4K | 0.89 | claude-sonnet-5-5 |  |
| agent-acf4559caa270af9d | mayker-dev:builder | deliver | 5 | 11 | 30 | 3.0 | 1/2/7 | 4.00/3.50/2.71 | 6.2K | 60.5K | 68.1K | 0.917 | claude-sonnet-5-5 |  |
| agent-ad11bcc971d9278e3 | mayker-dev:builder | deliver | 5 | 4 | 7 | 2.33 | 2/0/1 | 3.00/n/a/1.00 | 1.3K | 52.5K | 69.3K | 0.732 | claude-sonnet-5-5 |  |
| agent-ad32c0e9e2bdce736 | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 1/1/4 | 4.00/9.00/2.50 | 6.3K | 62.8K | 71.5K | 0.867 | claude-sonnet-5-5 |  |
| agent-ad800c08ba49caa73 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 4.6K | 53.5K | 61.5K | 0.848 | claude-fable-5-1 |  |
| agent-adc7e416ec1bc893c | mayker-dev:planner | deliver | 5 | 11 | 33 | 3.3 | 2/1/7 | 7.00/2.00/2.43 | 17.0K | 89.2K | 108.8K | 0.902 | claude-opus-5-5 |  |
| agent-ae2d473ecdad475f6 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.2K | 45.7K | 56.0K | 0.765 | claude-sonnet-5-5 |  |
| agent-ae762b87582405eb9 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 7.00/1.00/1.50 | 5.7K | 50.6K | 56.7K | 0.875 | claude-fable-5-1 |  |
| agent-ae770d86f66485da2 | mayker-dev:orchestrator | deliver | 5 | 5 | 17 | 4.25 | 1/1/2 | 8.00/2.00/3.50 | 6.2K | 53.5K | 61.0K | 0.771 | claude-fable-5-1 |  |
| agent-ae7dd0762ad85fbc4 | mayker-dev:builder | deliver | 5 | 7 | 17 | 2.83 | 1/2/3 | 6.00/3.50/1.33 | 5.0K | 57.8K | 64.6K | 0.84 | claude-sonnet-5-5 |  |
| agent-ae811f64d1be40a27 | mayker-dev:builder | deliver | 5 | 4 | 9 | 3.0 | 2/0/1 | 3.50/n/a/2.00 | 1.5K | 52.9K | 65.6K | 0.751 | claude-sonnet-5-5 |  |
| agent-affa84c1d3ab82dc2 | mayker-dev:builder | deliver | 5 | 8 | 23 | 3.29 | 2/2/3 | 4.50/5.50/1.00 | 7.7K | 62.6K | 70.5K | 0.885 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 68.4K, peak 129.7K, 0 above the auto threshold (80% of the serving model's window). Distribution: 56.0K, 56.1K, 56.7K, 57.1K, 57.7K, 58.7K, 59.0K, 59.1K, 60.1K, 61.0K, 61.0K, 61.4K, 61.5K, 61.9K, 62.4K, 62.4K, 63.3K, 64.6K, 64.6K, 65.3K, 65.6K, 66.9K, 68.1K, 68.6K, 68.9K, 69.2K, 69.3K, 69.7K, 70.0K, 70.5K, 70.5K, 70.9K, 71.2K, 71.5K, 71.7K, 72.0K, 74.8K, 75.1K, 77.7K, 92.3K, 95.3K, 100.5K, 108.8K, 110.9K, 119.4K, 129.7K.

**All runs:** 1 run(s), wall 56m33s (sum of per-run walls, idle time between runs excluded), 540 turns, 1143 tool calls, 463.5K output tokens, cache hit 0.957.

Turn classes across every bucket, read / edit / exec: 96/77/263 turns, 4.28/2.49/1.82 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 42m22s of round trip (command plus model time, ADR 0006 section 2): 75% of wall.

All runs: CI wait: 14m32s in `ci-poll.sh` calls; framework wall (wall less CI wait) 42m01s.

1 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 1/0/0).
