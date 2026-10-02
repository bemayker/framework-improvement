# Run statistics, run

Generated 2026-10-02 14:07 UTC. Token metrics: available. Skill load: read.

Subagent dispatches: 34 subagent transcript(s) read; this session has a run-level unit, so they are the RUN's and are not attributed to any single work item (MDF-174).

Context threshold: auto, so a turn is flagged when its context exceeded 80% of the context window of the model that SERVED it, not a fixed token count (window table checked 2026-10-01; a model the table has no row for is never flagged and is named below). No cost is estimated: per-token pricing depends on commercial terms this framework cannot know, so tokens and wall time are recorded and money is left to whoever knows the rates (decision record 0004).

## Run: deliver

| Step | Title | Wall | Turns | Tool calls | Tools/turn | Max batch | Out tok | Ctx avg | Ctx max | Retries | Cache hit | Model | R/E/X turns | R/E/X tools/turn | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | Ingest the backlog | 3m48s | 19 | 29 | 1.61 | 5 | 5.3K | 114.5K | 140.4K | 0 | 0.935 | claude-opus-5-5 | 2/2/10 | 3.00/1.00/1.50 |  |
| 5 | The scheduler loop | 41m14s | 355 | 660 | 1.98 | 13 | 112.9K | 157.1K | 431.6K | 0 | 0.956 | claude-opus-5-5 | 47/13/227 | 4.87/3.54/1.44 |  |
| 8 | Final report | n/a | 0 | 0 | n/a | 0 | 0 | n/a | n/a | 0 | n/a | n/a | 0/0/0 | n/a/n/a/n/a |  |
| **run total** |  | 45m02s | 374 | 689 | 1.96 | 13 | 118.2K |  | 431.6K |  | 0.955 | claude-opus-5-5 | 49/15/237 | 4.80/3.20/1.45 |  |

Wall is this run's last step end minus its first step start; steps sum to 45m02s.

## Dispatches (per subagent transcript)

Per-dispatch context is the grain a per-phase dispatch change is graded on: a step window mixes a dispatch's turns with the dispatching session's, so neither is a per-dispatch figure.

| Agent | Role | Run | Steps | Turns | Tool calls | Tools/turn | R/E/X turns | R/E/X tools/turn | Out tok | Ctx avg | Ctx max | Cache hit | Model | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agent-a0f5f3391003f1e94 | mayker-dev:orchestrator | deliver | 5 | 3 | 9 | 3.0 | 0/0/2 | n/a/n/a/4.00 | 6 | 62.4K | 71.6K | 0.617 | claude-fable-5-1 |  |
| agent-a221518d0ebd88dc2 | mayker-dev:planner | deliver | 5 | 11 | 15 | 1.36 | 0/0/10 | n/a/n/a/1.40 | 117 | 94.2K | 119.9K | 0.884 | claude-opus-5-5 |  |
| agent-a25376a3451f85ee1 | mayker-dev:builder | deliver | 5 | 4 | 7 | 1.75 | 1/1/1 | 4.00/1.00/1.00 | 80 | 65.0K | 70.7K | 0.814 | claude-sonnet-5-5 |  |
| agent-a28142a3b65705a26 | mayker-dev:reviewer | deliver | 5 | 4 | 23 | 5.75 | 3/0/0 | 7.33/n/a/n/a | 34 | 52.4K | 68.2K | 0.717 | claude-opus-5-5 |  |
| agent-a31c35c81a7e83a06 | mayker-dev:planner | deliver | 5 | 13 | 18 | 1.38 | 0/0/12 | n/a/n/a/1.42 | 134 | 91.9K | 110.0K | 0.908 | claude-opus-5-5 |  |
| agent-a374f98b02db22410 | mayker-dev:builder | deliver | 5 | 6 | 10 | 1.67 | 1/0/4 | 2.00/n/a/1.75 | 109 | 69.1K | 76.7K | 0.869 | claude-sonnet-5-5 |  |
| agent-a3927fa932567d850 | mayker-dev:builder | deliver | 5 | 7 | 11 | 1.57 | 2/1/3 | 2.50/2.00/1.00 | 241 | 66.5K | 72.3K | 0.893 | claude-sonnet-5-5 |  |
| agent-a48a7bd986ca9af30 | mayker-dev:builder | deliver | 5 | 6 | 12 | 2.0 | 2/0/3 | 4.00/n/a/1.00 | 87 | 64.0K | 68.4K | 0.88 | claude-sonnet-5-5 |  |
| agent-a497c9cf3176408bd | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.2 | 2/0/2 | 4.00/n/a/1.00 | 71 | 65.2K | 71.4K | 0.849 | claude-sonnet-5-5 |  |
| agent-a4b5b61f55a3a5ce0 | mayker-dev:builder | deliver | 5 | 8 | 20 | 2.5 | 2/0/5 | 7.00/n/a/1.00 | 104 | 80.6K | 88.6K | 0.863 | claude-sonnet-5-5 |  |
| agent-a4b86a3686bda3edb | mayker-dev:builder | deliver | 5 | 12 | 29 | 2.42 | 2/3/6 | 2.50/4.33/1.67 | 416 | 82.1K | 88.9K | 0.91 | claude-sonnet-5-5 |  |
| agent-a4d28c41179fd5877 | mayker-dev:orchestrator | deliver | 3 | 6 | 14 | 2.33 | 1/1/3 | 5.00/1.00/2.33 | 48 | 86.4K | 103.5K | 0.8 | claude-fable-5-1 |  |
| agent-a51eddefd7a2f75e4 | mayker-dev:builder | deliver | 5 | 7 | 16 | 2.29 | 1/2/3 | 6.00/3.00/1.00 | 133 | 63.9K | 67.7K | 0.898 | claude-sonnet-5-5 |  |
| agent-a532c3330800dcc18 | mayker-dev:orchestrator | deliver | 5 | 6 | 12 | 2.0 | 1/0/4 | 6.00/n/a/1.25 | 162 | 66.1K | 74.0K | 0.813 | claude-fable-5-1 |  |
| agent-a54f659dd3729d085 | mayker-dev:planner | deliver | 5 | 13 | 13 | 1.0 | 1/0/11 | 1.00/n/a/1.00 | 282 | 86.6K | 109.5K | 0.903 | claude-opus-5-5 |  |
| agent-a594f60a7654b128e | mayker-dev:orchestrator | deliver | 5 | 4 | 8 | 2.0 | 1/0/2 | 4.00/n/a/1.50 | 183 | 57.0K | 60.8K | 0.733 | claude-fable-5-1 |  |
| agent-a5dcdd768c0134db1 | mayker-dev:orchestrator | deliver | 5 | 3 | 6 | 2.0 | 1/0/1 | 4.00/n/a/1.00 | 33 | 55.7K | 59.9K | 0.768 | claude-fable-5-1 |  |
| agent-a6f8df3f790fbdcb6 | mayker-dev:builder | deliver | 5 | 7 | 18 | 2.57 | 1/1/4 | 6.00/7.00/1.00 | 133 | 65.9K | 70.9K | 0.895 | claude-sonnet-5-5 |  |
| agent-a6fa094c51ab3585b | mayker-dev:builder | deliver | 5 | 11 | 18 | 1.64 | 1/1/8 | 4.00/2.00/1.38 | 123 | 64.1K | 69.5K | 0.933 | claude-sonnet-5-5 |  |
| agent-a6fbb8adcc1fc5f59 | mayker-dev:orchestrator | deliver | 5 | 6 | 16 | 2.67 | 1/0/4 | 8.00/n/a/1.75 | 38 | 76.4K | 92.7K | 0.844 | claude-fable-5-1 |  |
| agent-a71581111bf03eccc | mayker-dev:builder | deliver | 5 | 6 | 15 | 2.5 | 2/1/2 | 3.50/2.00/2.50 | 82 | 81.2K | 92.0K | 0.857 | claude-sonnet-5-5 |  |
| agent-a718ec9ffee20257c | mayker-dev:orchestrator | deliver | 5 | 5 | 11 | 2.2 | 1/0/3 | 6.00/n/a/1.33 | 126 | 65.6K | 72.9K | 0.842 | claude-fable-5-1 |  |
| agent-a87724c4e55e064f9 | mayker-dev:planner | deliver | 5 | 14 | 21 | 1.5 | 2/0/11 | 1.50/n/a/1.55 | 288 | 95.6K | 113.3K | 0.915 | claude-opus-5-5 |  |
| agent-a8db54e57c2f6e8ae | mayker-dev:builder | deliver | 5 | 5 | 11 | 2.2 | 1/1/2 | 4.00/4.00/1.00 | 87 | 65.5K | 71.3K | 0.85 | claude-sonnet-5-5 |  |
| agent-a93c30e23420def7f | mayker-dev:builder | deliver | 5 | 7 | 13 | 1.86 | 1/0/5 | 4.00/n/a/1.60 | 93 | 74.2K | 80.4K | 0.845 | claude-sonnet-5-5 |  |
| agent-a95780c7694cfbf67 | mayker-dev:reviewer | deliver | 5 | 4 | 24 | 6.0 | 3/0/0 | 7.67/n/a/n/a | 20 | 49.7K | 64.3K | 0.721 | claude-opus-5-5 |  |
| agent-aa2d16deaea4dd524 | mayker-dev:reviewer | deliver | 5 | 4 | 15 | 3.75 | 3/0/0 | 4.67/n/a/n/a | 68 | 46.5K | 56.2K | 0.698 | claude-opus-5-5 |  |
| agent-ab1acba0836261621 | mayker-dev:builder | deliver | 5 | 5 | 9 | 1.8 | 1/1/2 | 4.00/2.00/1.00 | 81 | 63.4K | 68.2K | 0.855 | claude-sonnet-5-5 |  |
| agent-ab5d8c280ee736b3d | mayker-dev:builder | deliver | 5 | 14 | 21 | 1.5 | 1/0/12 | 6.00/n/a/1.17 | 204 | 84.3K | 90.8K | 0.942 | claude-sonnet-5-5 |  |
| agent-ab6e56cab51aff7f3 | mayker-dev:builder | deliver | 5 | 6 | 20 | 3.33 | 1/1/3 | 4.00/7.00/2.67 | 122 | 78.2K | 89.3K | 0.81 | claude-sonnet-5-5 |  |
| agent-aceaab36d78974821 | mayker-dev:orchestrator | deliver | 5 | 3 | 6 | 2.0 | 1/0/1 | 4.00/n/a/1.00 | 30 | 56.0K | 60.4K | 0.767 | claude-fable-5-1 |  |
| agent-adbaa9c702079c590 | mayker-dev:reviewer | deliver | 5 | 4 | 21 | 5.25 | 3/0/0 | 6.67/n/a/n/a | 18 | 48.8K | 63.4K | 0.721 | claude-opus-5-5 |  |
| agent-adc8ac31a7de14987 | mayker-dev:reviewer | deliver | 5 | 4 | 18 | 4.5 | 3/0/0 | 5.67/n/a/n/a | 33 | 49.1K | 61.7K | 0.686 | claude-opus-5-5 |  |
| agent-adfa45bf8db08a7f0 | mayker-dev:orchestrator | deliver | 5 | 5 | 14 | 2.8 | 1/0/3 | 6.00/n/a/2.33 | 19 | 68.4K | 83.3K | 0.818 | claude-fable-5-1 |  |

**34 dispatch(es)** (mayker-dev:builder 16, mayker-dev:orchestrator 9, mayker-dev:planner 4, mayker-dev:reviewer 5): median ctx max 71.9K, peak 119.9K, 0 above the auto threshold (80% of the serving model's window). Distribution: 56.2K, 59.9K, 60.4K, 60.8K, 61.7K, 63.4K, 64.3K, 67.7K, 68.2K, 68.2K, 68.4K, 69.5K, 70.7K, 70.9K, 71.3K, 71.4K, 71.6K, 72.3K, 72.9K, 74.0K, 76.7K, 80.4K, 83.3K, 88.6K, 88.9K, 89.3K, 90.8K, 92.0K, 92.7K, 103.5K, 109.5K, 110.0K, 113.3K, 119.9K.

**All runs:** 1 run(s), wall 45m02s (sum of per-run walls, idle time between runs excluded), 374 turns, 689 tool calls, 118.2K output tokens, cache hit 0.955.

Turn classes across every bucket, read / edit / exec: 49/15/237 turns, 4.80/3.20/1.45 tools per turn. The **read** figure is the one a batching mandate can be graded on; edits batch weakly and an exec turn is serial by construction.

11 turn(s) in this transcript fell outside every run of this unit and are excluded (read/edit/exec 2/0/7).
