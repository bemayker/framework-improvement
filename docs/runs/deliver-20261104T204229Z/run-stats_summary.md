# Run statistics, run

Generated 2026-11-04 21:38 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 46 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **run total** |  | 56m15s | 567 | 1114 | 2.23 | 15 | 468.4K |  | 482.3K |  | 0.959 | claude-opus-5-5 | 81/93/293 (exec 83% of wall) | 4.17/2.15/1.78 |  |

Wall is this run's last step end minus its first step start; steps sum to 56m16s.

Exec turns took 46m33s of round trip (command plus model time, ADR 0006 section 2): 83% of wall.

CI wait: 15m41s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m34s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a025e20f38e68121e | mayker-dev:planner | deliver | 5 | 15 | 34 | 2.43 | 3/2/9 | 4.00/1.50/2.11 | 19.5K | 98.8K | 120.2K | 0.928 | claude-opus-5-5 |  |
| agent-a112fccd76fbfb19a | mayker-dev:builder | deliver | 5 | 11 | 21 | 2.1 | 1/4/5 | 7.00/2.25/1.00 | 5.5K | 56.6K | 61.5K | 0.922 | claude-sonnet-5-5 |  |
| agent-a126337bb42fdc705 | mayker-dev:orchestrator | deliver | 3 | 10 | 31 | 3.44 | 1/3/5 | 4.00/2.00/4.20 | 15.4K | 91.3K | 116.9K | 0.872 | claude-fable-5-1 |  |
| agent-a13e717bffd4498ef | mayker-dev:builder | deliver | 5 | 9 | 14 | 1.75 | 1/2/5 | 2.00/1.50/1.80 | 7.3K | 55.0K | 62.8K | 0.899 | claude-sonnet-5-5 |  |
| agent-a1a3b04a2bec1f41e | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 5.00/5.00/1.00 | 3.0K | 48.0K | 51.9K | 0.865 | claude-sonnet-5-5 |  |
| agent-a1a8d9d16544c8dbd | mayker-dev:builder | deliver | 5 | 7 | 19 | 3.17 | 2/2/2 | 4.00/4.50/1.00 | 5.7K | 56.3K | 66.0K | 0.833 | claude-sonnet-5-5 |  |
| agent-a1cf8d40533c77ca9 | mayker-dev:builder | deliver | 5 | 7 | 10 | 1.67 | 2/1/3 | 2.00/2.00/1.33 | 5.1K | 51.7K | 59.5K | 0.872 | claude-sonnet-5-5 |  |
| agent-a2aa2f719daefde7a | mayker-dev:orchestrator | deliver | 5 | 8 | 18 | 2.57 | 1/2/4 | 4.00/2.00/2.50 | 12.6K | 76.5K | 97.7K | 0.861 | claude-fable-5-1 |  |
| agent-a307144179698c0e2 | mayker-dev:orchestrator | deliver | 5 | 6 | 13 | 2.6 | 1/1/3 | 9.00/1.00/1.00 | 6.0K | 62.0K | 68.9K | 0.849 | claude-fable-5-1 |  |
| agent-a3827e1b81e6c7dd9 | mayker-dev:reviewer | deliver | 5 | 5 | 24 | 6.0 | 4/0/0 | 6.00/n/a/n/a | 6.9K | 59.8K | 74.1K | 0.783 | claude-opus-5-5 |  |
| agent-a3a001a1635608b3c | mayker-dev:planner | deliver | 5 | 13 | 40 | 3.33 | 1/3/7 | 4.00/2.00/3.29 | 17.5K | 78.6K | 97.8K | 0.904 | claude-opus-5-5 |  |
| agent-a43d0b95a1e9629a0 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 1/1/3 | 7.00/1.00/1.00 | 5.1K | 48.7K | 53.2K | 0.861 | claude-fable-5-1 |  |
| agent-a49ab910161f39687 | mayker-dev:orchestrator | deliver | 5 | 8 | 12 | 2.0 | 1/1/4 | 4.00/1.00/1.75 | 6.7K | 58.0K | 66.4K | 0.884 | claude-fable-5-1 |  |
| agent-a4c34b68bce284dca | mayker-dev:planner | deliver | 5 | 15 | 43 | 3.07 | 1/2/10 | 4.00/2.50/3.30 | 24.5K | 94.7K | 120.3K | 0.924 | claude-opus-5-5 |  |
| agent-a54d4174c0e2e74d8 | mayker-dev:builder | deliver | 5 | 8 | 16 | 2.29 | 2/2/3 | 3.00/3.50/1.00 | 8.2K | 61.4K | 71.4K | 0.881 | claude-sonnet-5-5 |  |
| agent-a554aa84b8e235174 | mayker-dev:builder | deliver | 5 | 11 | 19 | 1.9 | 2/4/4 | 4.00/1.75/1.00 | 5.8K | 59.1K | 64.8K | 0.92 | claude-sonnet-5-5 |  |
| agent-a5727893b4827a565 | mayker-dev:orchestrator | deliver | 5 | 7 | 13 | 2.17 | 2/1/3 | 3.50/1.00/1.67 | 4.7K | 55.3K | 64.8K | 0.832 | claude-fable-5-1 |  |
| agent-a58c382fa31eb037b | mayker-dev:builder | deliver | 5 | 6 | 13 | 2.6 | 2/1/2 | 5.00/1.00/1.00 | 2.9K | 51.5K | 56.8K | 0.858 | claude-sonnet-5-5 |  |
| agent-a5e4a8c9c23ef1d50 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.4 | 1/1/3 | 8.00/1.00/1.00 | 5.2K | 54.0K | 59.2K | 0.856 | claude-fable-5-1 |  |
| agent-a5fcb64f206cdd39d | mayker-dev:orchestrator | deliver | 8 | 7 | 10 | 2.0 | 1/0/4 | 1.00/n/a/2.25 | 15.1K | 59.1K | 69.8K | 0.862 | claude-fable-5-1 |  |
| agent-a837ac300b1a85bb6 | mayker-dev:builder | deliver | 5 | 10 | 13 | 1.44 | 2/2/5 | 2.00/1.50/1.20 | 5.8K | 53.7K | 60.3K | 0.912 | claude-sonnet-5-5 |  |
| agent-a83dea441cd905f3f | mayker-dev:builder | deliver | 5 | 14 | 22 | 1.69 | 1/1/10 | 3.00/2.00/1.60 | 6.2K | 62.2K | 69.2K | 0.935 | claude-sonnet-5-5 |  |
| agent-a89217742a090c36c | mayker-dev:builder | deliver | 5 | 17 | 23 | 1.44 | 1/1/14 | 4.00/2.00/1.21 | 5.3K | 55.4K | 61.3K | 0.949 | claude-sonnet-5-5 |  |
| agent-a8a4b3575ac9b40ed | mayker-dev:builder | deliver | 5 | 6 | 8 | 1.6 | 1/2/2 | 4.00/1.00/1.00 | 2.4K | 48.9K | 52.8K | 0.864 | claude-sonnet-5-5 |  |
| agent-a8de2f612bb3c4688 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 5.1K | 51.4K | 65.1K | 0.728 | claude-opus-5-5 |  |
| agent-a929402aa9af31102 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 5.0 | 3/0/0 | 5.00/n/a/n/a | 5.4K | 49.6K | 63.2K | 0.681 | claude-opus-5-5 |  |
| agent-a986d7a50a8582b22 | mayker-dev:reviewer | deliver | 5 | 4 | 19 | 6.33 | 3/0/0 | 6.33/n/a/n/a | 7.3K | 55.5K | 76.8K | 0.695 | claude-opus-5-5 |  |
| agent-a992b3c4e7adcc02f | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 925 | 50.6K | 65.6K | 0.74 | claude-sonnet-5-5 |  |
| agent-aa6dc2831db0a4ba9 | mayker-dev:orchestrator | deliver | 5 | 6 | 11 | 2.2 | 2/1/2 | 3.50/2.00/1.00 | 5.1K | 52.1K | 60.9K | 0.845 | claude-fable-5-1 |  |
| agent-aa7de847a86693eb3 | mayker-dev:planner | deliver | 5 | 10 | 33 | 3.67 | 1/1/7 | 5.00/2.00/3.71 | 14.2K | 79.9K | 103.8K | 0.886 | claude-opus-5-5 |  |
| agent-aa8c38eb24c1a4290 | mayker-dev:orchestrator | deliver | 5 | 7 | 16 | 2.67 | 1/1/4 | 7.00/2.00/1.75 | 8.7K | 61.3K | 72.2K | 0.861 | claude-fable-5-1 |  |
| agent-aa9368253bc90ac3a | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 46.9K | 61.0K | 0.744 | claude-sonnet-5-5 |  |
| agent-aaa1ebe3a7dd19f97 | mayker-dev:orchestrator | deliver | 5 | 7 | 11 | 1.83 | 2/1/3 | 3.00/1.00/1.33 | 4.1K | 56.5K | 66.1K | 0.864 | claude-fable-5-1 |  |
| agent-aae89f1696f77c832 | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.1K | 45.6K | 55.9K | 0.765 | claude-sonnet-5-5 |  |
| agent-ab0e6ae36acba7467 | mayker-dev:builder | deliver | 5 | 7 | 29 | 4.83 | 2/2/2 | 6.50/6.50/1.50 | 9.4K | 62.0K | 73.3K | 0.831 | claude-sonnet-5-5 |  |
| agent-ab3b2d74592bb1bcf | mayker-dev:orchestrator | deliver | 5 | 7 | 17 | 2.83 | 1/1/4 | 7.00/1.00/2.25 | 8.4K | 57.7K | 65.1K | 0.87 | claude-fable-5-1 |  |
| agent-ac1867eded4041f78 | mayker-dev:planner | deliver | 5 | 14 | 32 | 2.46 | 2/2/8 | 5.00/1.50/1.62 | 12.6K | 77.4K | 92.1K | 0.915 | claude-opus-5-5 |  |
| agent-accacb2321a89d338 | mayker-dev:builder | deliver | 5 | 11 | 20 | 2.0 | 2/3/5 | 4.00/2.33/1.00 | 7.6K | 64.1K | 71.3K | 0.917 | claude-sonnet-5-5 |  |
| agent-acd0432be34d6842a | mayker-dev:builder | deliver | 5 | 8 | 25 | 3.57 | 2/1/4 | 4.50/9.00/1.75 | 7.3K | 61.8K | 71.7K | 0.881 | claude-sonnet-5-5 |  |
| agent-ad84be6b7f3ad5fb0 | mayker-dev:builder | deliver | 5 | 3 | 5 | 2.5 | 0/0/2 | n/a/n/a/2.50 | 951 | 37.6K | 40.4K | 0.757 | claude-sonnet-5-5 |  |
| agent-adb52773c09aaa90f | mayker-dev:orchestrator | deliver | 5 | 6 | 10 | 2.0 | 2/1/2 | 3.50/1.00/1.00 | 4.6K | 52.9K | 59.0K | 0.814 | claude-fable-5-1 |  |
| agent-add11a00113aa73ce | mayker-dev:builder | deliver | 5 | 9 | 15 | 1.88 | 1/2/5 | 2.00/1.50/2.00 | 7.7K | 59.0K | 68.1K | 0.896 | claude-sonnet-5-5 |  |
| agent-ae1a334ef7b2f0236 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 7.0 | 3/0/0 | 7.00/n/a/n/a | 5.5K | 52.6K | 68.8K | 0.673 | claude-opus-5-5 |  |
| agent-ae5a1217148ae618d | mayker-dev:builder | deliver | 5 | 4 | 5 | 1.67 | 2/0/1 | 2.00/n/a/1.00 | 1.0K | 47.0K | 60.2K | 0.749 | claude-sonnet-5-5 |  |
| agent-af8a5ff85fb99c099 | mayker-dev:builder | deliver | 5 | 8 | 23 | 3.29 | 2/3/2 | 3.00/4.00/2.50 | 8.2K | 64.7K | 75.7K | 0.879 | claude-sonnet-5-5 |  |
| agent-affaa968846d3907b | mayker-dev:builder | deliver | 5 | 11 | 23 | 2.3 | 1/1/8 | 3.00/3.00/2.12 | 5.3K | 61.2K | 68.2K | 0.918 | claude-sonnet-5-5 |  |

**46 dispatch(es)** in `deliver` (mayker-dev:builder 23, mayker-dev:orchestrator 13, mayker-dev:planner 5, mayker-dev:reviewer 5): median ctx max 66.1K, peak 120.3K, 0 above the auto threshold (80% of the serving model's window). Distribution: 40.4K, 51.9K, 52.8K, 53.2K, 55.9K, 56.8K, 59.0K, 59.2K, 59.5K, 60.2K, 60.3K, 60.9K, 61.0K, 61.3K, 61.5K, 62.8K, 63.2K, 64.8K, 64.8K, 65.1K, 65.1K, 65.6K, 66.0K, 66.1K, 66.4K, 68.1K, 68.2K, 68.8K, 68.9K, 69.2K, 69.8K, 71.3K, 71.4K, 71.7K, 72.2K, 73.3K, 74.1K, 75.7K, 76.8K, 92.1K, 97.7K, 97.8K, 103.8K, 116.9K, 120.2K, 120.3K.

**All runs:** 1 run(s), wall 56m15s (sum of per-run walls, idle time between runs excluded), 567 turns, 1114 tool calls, 468.4K output tokens, cache hit 0.959.

Turn classes across every bucket, read / edit / exec: 81/93/293 turns, 4.17/2.15/1.78 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

All runs: Exec turns took 46m33s of round trip (command plus model time, ADR 0006 section 2): 83% of wall.

All runs: CI wait: 15m41s in `ci-poll.sh` calls; framework wall (wall less CI wait) 40m34s.

2 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/0).
