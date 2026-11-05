# Run statistics, run

Generated 2026-11-05 14:26 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 1h05m | 592 | 1084 | 2.07 | 14 | 444.1K |  | 472.0K |  | 0.962 | claude-opus-5-5 | 98/87/293 (exec 87% of wall) | 3.66/2.16/1.62 |  |

Wall is this run's last step end minus its first step start; steps sum to 1h05m.

Exec turns took 57m25s of round trip (command plus model time, ADR 0006 section 2): 87% of wall.

CI wait: 11m11s in `ci-poll.sh` calls; framework wall (wall less CI wait) 54m37s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a04e52f9590a6bab1 | mayker-dev:planner | deliver | 5 | 10 | 25 | 2.78 | 3/2/4 | 4.00/1.50/2.50 | 12.3K | 70.8K | 85.7K | 0.879 | claude-opus-5-5 |  |
| agent-a07be69fe0908b807 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 1/1/4 | 4.00/1.00/1.50 | 4.3K | 49.7K | 55.2K | 0.877 | claude-fable-5-1 |  |
| agent-a0c6872a16c382b2a | mayker-dev:builder | deliver | 5 | 6 | 10 | 2.0 | 1/2/2 | 4.00/2.00/1.00 | 2.8K | 51.3K | 56.1K | 0.86 | claude-sonnet-5-5 |  |
| agent-a12de7826d7e7a995 | mayker-dev:builder | deliver | 5 | 13 | 24 | 2.0 | 2/4/6 | 3.50/2.75/1.00 | 6.3K | 58.1K | 63.8K | 0.933 | claude-sonnet-5-5 |  |
| agent-a14c6d4d331bdc996 | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 1/2/4 | 4.00/2.00/2.50 | 12.5K | 84.9K | 107.9K | 0.841 | claude-fable-5-1 |  |
| agent-a15cf69e802e4150e | mayker-dev:builder | deliver | 5 | 5 | 9 | 2.25 | 2/1/1 | 3.50/1.00/1.00 | 2.0K | 48.7K | 53.7K | 0.833 | claude-sonnet-5-5 |  |
| agent-a162f409f883a2ed5 | mayker-dev:builder | deliver | 5 | 8 | 13 | 1.86 | 2/2/3 | 2.50/2.00/1.33 | 5.1K | 53.6K | 58.8K | 0.893 | claude-sonnet-5-5 |  |
| agent-a209f786e491e02d9 | mayker-dev:orchestrator | deliver | 5 | 9 | 24 | 3.0 | 1/2/4 | 4.00/2.50/2.75 | 19.3K | 90.6K | 122.1K | 0.866 | claude-fable-5-1 |  |
| agent-a231a7b8b701f4b1c | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 46.2K | 56.8K | 0.763 | claude-sonnet-5-5 |  |
| agent-a34d202990834381e | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 1/1/4 | 4.00/1.00/1.50 | 4.5K | 49.2K | 54.8K | 0.84 | claude-fable-5-1 |  |
| agent-a3506eae35b14afb7 | mayker-dev:builder | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 2.50/5.00/1.00 | 5.1K | 54.8K | 60.5K | 0.876 | claude-sonnet-5-5 |  |
| agent-a39fa96d373d1f145 | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.50/1.50/1.00 | 6.3K | 53.2K | 59.8K | 0.902 | claude-sonnet-5-5 |  |
| agent-a3e2af12220cb7764 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 3.1K | 47.1K | 51.9K | 0.816 | claude-fable-5-1 |  |
| agent-a47c6a827f27daca9 | mayker-dev:reviewer | deliver | 5 | 5 | 21 | 5.25 | 4/0/0 | 5.25/n/a/n/a | 5.0K | 54.5K | 66.6K | 0.79 | claude-opus-5-5 |  |
| agent-a49620f6a7f9b3178 | mayker-dev:builder | deliver | 5 | 12 | 20 | 1.82 | 2/1/7 | 3.00/2.00/1.57 | 4.9K | 63.3K | 69.9K | 0.925 | claude-sonnet-5-5 |  |
| agent-a5014b896772c32ae | mayker-dev:reviewer | deliver | 5 | 4 | 23 | 7.67 | 3/0/0 | 7.67/n/a/n/a | 7.8K | 53.5K | 68.7K | 0.722 | claude-opus-5-5 |  |
| agent-a501d36399ca6c3e5 | mayker-dev:builder | deliver | 5 | 10 | 17 | 1.89 | 2/2/4 | 3.00/2.00/1.50 | 4.5K | 55.6K | 61.1K | 0.913 | claude-sonnet-5-5 |  |
| agent-a5fc238c9aef64545 | mayker-dev:orchestrator | deliver | 5 | 6 | 9 | 1.8 | 2/1/2 | 3.00/1.00/1.00 | 4.2K | 47.5K | 52.7K | 0.859 | claude-fable-5-1 |  |
| agent-a6ace35d197092395 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 8.00/1.00/1.75 | 5.4K | 53.3K | 58.9K | 0.876 | claude-fable-5-1 |  |
| agent-a6ced31d2a41ed8f2 | mayker-dev:orchestrator | deliver | 5 | 7 | 14 | 2.33 | 1/1/4 | 7.00/1.00/1.50 | 7.7K | 60.3K | 69.3K | 0.865 | claude-fable-5-1 |  |
| agent-a6ee799737fe8f74a | mayker-dev:builder | deliver | 5 | 7 | 23 | 3.83 | 1/1/4 | 3.00/9.00/2.75 | 6.7K | 60.1K | 70.5K | 0.832 | claude-sonnet-5-5 |  |
| agent-a70a693d3bb72fff6 | mayker-dev:planner | deliver | 5 | 16 | 36 | 2.4 | 3/3/9 | 1.33/1.00/3.22 | 14.0K | 87.5K | 104.3K | 0.935 | claude-opus-5-5 |  |
| agent-a71bc0d0ae8ab9ac5 | mayker-dev:builder | deliver | 5 | 4 | 6 | 2.0 | 2/0/1 | 2.50/n/a/1.00 | 1.4K | 49.7K | 63.8K | 0.744 | claude-sonnet-5-5 |  |
| agent-a732842281f28c6d2 | mayker-dev:builder | deliver | 5 | 3 | 4 | 2.0 | 2/0/0 | 2.00/n/a/n/a | 860 | 43.6K | 58.9K | 0.649 | claude-sonnet-5-5 |  |
| agent-a737967988a32b85d | mayker-dev:builder | deliver | 5 | 25 | 33 | 1.38 | 4/1/18 | 2.00/1.00/1.28 | 8.0K | 68.9K | 78.0K | 0.962 | claude-sonnet-5-5 |  |
| agent-a7694d22fddee2c22 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 52.0K | 64.2K | 0.754 | claude-sonnet-5-5 |  |
| agent-a79ce1f5db6ce83d8 | mayker-dev:builder | deliver | 5 | 8 | 31 | 4.43 | 1/2/4 | 4.00/7.00/3.25 | 8.9K | 63.9K | 72.9K | 0.883 | claude-sonnet-5-5 |  |
| agent-a832ff9c4592d84ed | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 3.5 | 2/1/1 | 4.00/2.00/4.00 | 5.0K | 48.6K | 54.5K | 0.828 | claude-fable-5-1 |  |
| agent-a87cead2a9c7551d4 | mayker-dev:reviewer | deliver | 5 | 3 | 16 | 8.0 | 2/0/0 | 8.00/n/a/n/a | 4.8K | 45.9K | 61.3K | 0.623 | claude-opus-5-5 |  |
| agent-a88aa3e1fe2bfd942 | mayker-dev:builder | deliver | 5 | 7 | 21 | 3.5 | 2/1/3 | 4.00/10.00/1.00 | 6.2K | 60.0K | 67.8K | 0.869 | claude-sonnet-5-5 |  |
| agent-a8dfc0ce2a60fa624 | mayker-dev:planner | deliver | 5 | 13 | 39 | 3.25 | 1/2/8 | 12.00/1.50/2.88 | 16.1K | 84.3K | 102.7K | 0.906 | claude-opus-5-5 |  |
| agent-a9071a20cfa76d347 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 8.3K | 49.3K | 63.8K | 0.677 | claude-opus-5-5 |  |
| agent-a97a9d2f1577baf73 | mayker-dev:planner | deliver | 5 | 17 | 42 | 2.62 | 2/3/10 | 5.50/1.67/2.50 | 22.7K | 88.7K | 110.6K | 0.935 | claude-opus-5-5 |  |
| agent-aa1db219ad1ded129 | mayker-dev:builder | deliver | 5 | 15 | 23 | 1.64 | 3/1/9 | 3.00/4.00/1.00 | 6.2K | 54.9K | 61.2K | 0.941 | claude-sonnet-5-5 |  |
| agent-aa98c228df6bd5d9c | mayker-dev:builder | deliver | 5 | 7 | 22 | 3.67 | 2/2/2 | 4.50/5.50/1.00 | 7.0K | 62.7K | 71.4K | 0.867 | claude-sonnet-5-5 |  |
| agent-aae053d91fc105cd2 | mayker-dev:orchestrator | deliver | 8 | 6 | 7 | 1.4 | 3/0/2 | 1.33/n/a/1.50 | 8.7K | 55.4K | 64.8K | 0.848 | claude-fable-5-1 |  |
| agent-ab4c0d82861db701c | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 8.00/2.00/1.00 | 6.0K | 53.5K | 60.3K | 0.812 | claude-fable-5-1 |  |
| agent-abda06c8124fc2e5d | mayker-dev:planner | deliver | 5 | 12 | 33 | 3.0 | 1/2/8 | 10.00/1.50/2.50 | 17.2K | 87.9K | 107.8K | 0.91 | claude-opus-5-5 |  |
| agent-abfe4e6db7d632948 | mayker-dev:orchestrator | deliver | 3 | 10 | 18 | 2.0 | 1/2/6 | 4.00/2.00/1.67 | 14.7K | 82.2K | 104.7K | 0.872 | claude-fable-5-1 |  |
| agent-ac149098f06b7e4d5 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 7.00/1.00/1.00 | 5.8K | 52.9K | 59.6K | 0.852 | claude-fable-5-1 |  |
| agent-ac575b10249d9223c | mayker-dev:builder | deliver | 5 | 9 | 12 | 1.5 | 2/2/4 | 2.50/1.50/1.00 | 6.5K | 54.6K | 61.2K | 0.902 | claude-sonnet-5-5 |  |
| agent-ac9c82de17bd47f17 | mayker-dev:builder | deliver | 5 | 7 | 9 | 1.5 | 3/1/2 | 1.67/1.00/1.50 | 1.9K | 54.2K | 63.8K | 0.866 | claude-sonnet-5-5 |  |
| agent-ad3c40ec703ca2bb7 | mayker-dev:reviewer | deliver | 5 | 5 | 24 | 6.0 | 4/0/0 | 6.00/n/a/n/a | 6.8K | 58.2K | 75.4K | 0.741 | claude-opus-5-5 |  |
| agent-ad6ff2967b91283da | mayker-dev:builder | deliver | 5 | 13 | 23 | 1.92 | 2/1/9 | 2.50/3.00/1.67 | 4.9K | 60.1K | 65.8K | 0.932 | claude-sonnet-5-5 |  |
| agent-af4d13f7d5103b006 | mayker-dev:builder | deliver | 5 | 8 | 11 | 1.57 | 2/1/4 | 2.50/2.00/1.00 | 4.5K | 53.4K | 59.1K | 0.892 | claude-sonnet-5-5 |  |
| agent-af62483d1d2b748de | mayker-dev:builder | deliver | 5 | 7 | 14 | 2.33 | 2/2/2 | 3.00/3.00/1.00 | 4.4K | 58.2K | 66.2K | 0.838 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 63.8K, peak 122.1K, 0 above the auto threshold (80% of the serving model's window). Distribution: 51.9K, 52.7K, 53.7K, 54.5K, 54.8K, 55.2K, 56.1K, 56.8K, 58.8K, 58.9K, 58.9K, 59.1K, 59.6K, 59.8K, 60.3K, 60.5K, 61.1K, 61.2K, 61.2K, 61.3K, 63.8K, 63.8K, 63.8K, 63.8K, 64.2K, 64.8K, 65.8K, 66.2K, 66.6K, 67.8K, 68.7K, 69.3K, 69.9K, 70.5K, 71.4K, 72.9K, 75.4K, 78.0K, 85.7K, 102.7K, 104.3K, 104.7K, 107.8K, 107.9K, 110.6K, 122.1K.

**All runs:** 1 run(s), wall 1h05m (sum of per-run walls, idle time between runs excluded), 592 turns, 1084 tool calls, 444.1K output tokens, cache hit 0.962.

Turn classes across every bucket, read / edit / exec: 98/87/293 turns, 3.66/2.16/1.62 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 57m25s of round trip (command plus model time, ADR 0006 section 2): 87% of wall.

All runs: CI wait: 11m11s in `ci-poll.sh` calls; framework wall (wall less CI wait) 54m37s.

3 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/1).
